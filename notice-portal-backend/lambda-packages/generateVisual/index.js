const fs = require("fs");
const path = require("path");
const { randomUUID } = require("crypto");

const pptxgen = require("pptxgenjs");
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.BUCKET_NAME || "notice-portal-visuals-kavii";
const LOGO_S3_KEY = process.env.LOGO_S3_KEY || "assets/logo.jpg";
const LOCAL_LOGO_PATH = path.join(__dirname, "logo.jpg");

const COLLEGE_NAME = process.env.COLLEGE_NAME || "SSM THE LEARNING HUB";
const COLLEGE_TAGLINE =
  process.env.COLLEGE_TAGLINE || "INFINITE POSSIBILITIES";
const COLLEGE_ADDRESS = process.env.COLLEGE_ADDRESS || "";

const SLIDE_W = 10;
const SLIDE_H = 7.5;
const MARGIN = 0.38;
const CONTENT_W = SLIDE_W - MARGIN * 2;
const FOOTER_H = 0.62;

const PAPER = "FDFBF9";
const INK = "1F2933";
const MUTED = "5B6570";
const WHITE = "FFFFFF";
const SSM_ORANGE = "FF5722";
const HEADER_BG = "FFF3EC";

const CATEGORY_STYLES = {
  Examination: {
    banner: "2E4A73",
    accent: "D4AF6A",
    badge: "EAF0F7",
    badgeText: "1B365D",
  },
  Workshop: {
    banner: "0F5C4C",
    accent: SSM_ORANGE,
    badge: "E6F4EF",
    badgeText: "0F5C4C",
  },
  Seminar: {
    banner: "4A1F6B",
    accent: "D4AF6A",
    badge: "F3EAF8",
    badgeText: "4A1F6B",
  },
  Placement: {
    banner: "16324F",
    accent: SSM_ORANGE,
    badge: "EEF3F8",
    badgeText: "16324F",
  },
  Sports: {
    banner: "8B1E1E",
    accent: SSM_ORANGE,
    badge: "F8EAEA",
    badgeText: "8B1E1E",
  },
  Cultural: {
    banner: "6B1F4A",
    accent: "D4AF6A",
    badge: "F8EAF2",
    badgeText: "6B1F4A",
  },
  General: {
    banner: "2C2C2C",
    accent: SSM_ORANGE,
    badge: "F0EEEB",
    badgeText: "2C2C2C",
  },
};

const CATEGORY_ALIASES = {
  examination: "Examination",
  workshop: "Workshop",
  seminar: "Seminar",
  placement: "Placement",
  sports: "Sports",
  cultural: "Cultural",
  general: "General",
};

exports.handler = async (event) => {
  try {
    const body = parseBody(event);
    const payload = normalizePayload(body);
    const missing = requiredFields(payload);

    if (missing.length > 0) {
      return jsonResponse(400, {
        error: `Missing required field${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}`,
      });
    }

    const style = CATEGORY_STYLES[payload.category] || CATEGORY_STYLES.General;
    const logo = await loadLogo();
    const pres = buildNotice(payload, style, logo);
    const pptxBuffer = await pres.write({ outputType: "nodebuffer" });

    const safeTitle = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48);
    const s3Key = `visuals/${randomUUID()}-${safeTitle || "notice"}.pptx`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: pptxBuffer,
        ContentType:
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ContentDisposition: `attachment; filename="${safeTitle || "notice"}.pptx"`,
      }),
    );

    const downloadUrl = await getSignedUrl(
      s3Client,
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key }),
      { expiresIn: 600 },
    );

    return jsonResponse(200, { s3Key, downloadUrl });
  } catch (err) {
    if (err instanceof SyntaxError) {
      return jsonResponse(400, { error: "Request body must be valid JSON" });
    }

    console.error(err);
    return jsonResponse(500, {
      error: "Something went wrong generating the visual",
    });
  }
};

function parseBody(event) {
  if (event == null) return {};

  if (typeof event.body === "string") {
    let raw = event.body;
    if (event.isBase64Encoded) {
      raw = Buffer.from(raw, "base64").toString("utf8");
    }
    const trimmed = raw.trim();
    return trimmed ? JSON.parse(trimmed) : {};
  }

  if (event.body && typeof event.body === "object") {
    return event.body;
  }

  if (event.title || event.category || event.department) {
    return event;
  }

  return {};
}

function normalizePayload(body) {
  const categoryKey = String(body.category || "")
    .trim()
    .toLowerCase();

  return {
    title: text(body.title),
    category: CATEGORY_ALIASES[categoryKey] || "",
    department: text(body.department),
    date: text(body.date),
    time: text(body.time),
    venue: text(body.venue),
    noticeBody: text(body.noticeBody || body.notice || body.content),
    subjects: asList(body.subjects)
      .map((row) => ({
        subject: text(row.subject),
        date: text(row.date),
        time: text(row.time),
      }))
      .filter((row) => row.subject),
    resourcePersons: asList(body.resourcePersons)
      .map((row) => ({
        name: text(row.name),
        designation: text(row.designation),
      }))
      .filter((row) => row.name),
    companyName: text(body.companyName),
    eligibility: text(body.eligibility),
    coordinators: asList(body.coordinators)
      .map((row) => ({
        name: text(row.name),
        role: text(row.role),
      }))
      .filter((row) => row.name),
  };
}

function requiredFields(payload) {
  const missing = [];
  if (!payload.title) missing.push("title");
  if (!payload.category) missing.push("category");
  if (!payload.department) missing.push("department");
  return missing;
}

function text(value) {
  if (value == null) return "";
  return String(value).trim();
}

function asList(value) {
  return Array.isArray(value) ? value.filter((item) => item != null) : [];
}

function jsonResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(payload),
  };
}

async function loadLogo() {
  if (fs.existsSync(LOCAL_LOGO_PATH)) {
    return { path: LOCAL_LOGO_PATH };
  }

  try {
    const object = await s3Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: LOGO_S3_KEY,
      }),
    );
    const bytes = await object.Body.transformToByteArray();
    const mime = object.ContentType || "image/jpeg";
    return {
      data: `${mime};base64,${Buffer.from(bytes).toString("base64")}`,
    };
  } catch (err) {
    console.error("Logo could not be loaded", err);
    return null;
  }
}

function buildNotice(payload, style, logo) {
  const pres = new pptxgen();
  pres.defineLayout({ name: "NOTICE_WIDE", width: SLIDE_W, height: SLIDE_H });
  pres.layout = "NOTICE_WIDE";
  pres.author = COLLEGE_NAME;
  pres.title = payload.title;
  pres.subject = `${payload.category} notice`;

  const slide = pres.addSlide();
  slide.background = { color: PAPER };

  const headerBottom = addHeader(slide, logo);
  const bannerBottom = addBanner(slide, payload, style, headerBottom);
  let cursor = addDetailBadges(slide, payload, style, bannerBottom + 0.12);
  cursor = addCategoryContent(slide, payload, style, cursor + 0.1);
  addFooter(slide, payload, style);

  return pres;
}

function addHeader(slide, logo) {
  return addBrandBand(slide, logo, 0, "bottom");
}

function footerText(payload) {
  if (payload.coordinators && payload.coordinators.length > 0) {
    return payload.coordinators
      .map((person) => {
        const role = person.role ? ` – ${person.role}` : "";
        return `Coordinator: ${person.name}${role}`;
      })
      .join(" | ");
  }

  const departmentName = payload.department || "Department";
  return `${departmentName} — Generated via AI Notice Portal`;
}

function addFooter(slide, payload, style) {
  const y = SLIDE_H - FOOTER_H;

  slide.addShape("rect", {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h: 0.03,
    fill: { color: style.accent },
  });

  slide.addText(footerText(payload), {
    x: MARGIN,
    y: y + 0.08,
    w: CONTENT_W,
    h: FOOTER_H - 0.12,
    fontFace: "Calibri",
    fontSize: 11,
    color: MUTED,
    valign: "middle",
    margin: 0,
  });
}

function addBrandBand(slide, logo, y, accentSide) {
  const bandH = 1.05;
  const accentH = 0.05;

  slide.addShape("rect", {
    x: 0,
    y,
    w: SLIDE_W,
    h: bandH,
    fill: { color: HEADER_BG },
  });

  const watermarkCenterX = SLIDE_W - 0.85;
  const watermarkCenterY = y + bandH / 2;
  [0.55, 0.9, 1.25, 1.6, 1.95].forEach((size) => {
    slide.addShape("ellipse", {
      x: watermarkCenterX - size / 2,
      y: watermarkCenterY - size / 2,
      w: size,
      h: size,
      fill: { type: "none" },
      line: { color: "F0C8B8", pt: 0.6 },
    });
  });

  slide.addShape("rect", {
    x: 0,
    y: accentSide === "top" ? y : y + bandH,
    w: SLIDE_W,
    h: accentH,
    fill: { color: SSM_ORANGE },
  });

  const logoSize = 0.72;
  const textX = logo ? MARGIN + logoSize + 0.16 : MARGIN;
  const textW = SLIDE_W - textX - 1.1;

  if (logo) {
    slide.addImage({
      ...logo,
      x: MARGIN,
      y: y + (bandH - logoSize) / 2,
      w: logoSize,
      h: logoSize,
      altText: `${COLLEGE_NAME} logo`,
    });
  }

  slide.addText(COLLEGE_NAME, {
    x: textX,
    y: y + 0.22,
    w: textW,
    h: 0.36,
    fontFace: "Calibri",
    fontSize: 18,
    bold: true,
    color: "1B365D",
    margin: 0,
  });
  slide.addText(COLLEGE_TAGLINE, {
    x: textX,
    y: y + 0.58,
    w: textW,
    h: 0.26,
    fontFace: "Calibri",
    fontSize: 11,
    color: SSM_ORANGE,
    charSpacing: 1.4,
    margin: 0,
  });

  return accentSide === "bottom" ? y + bandH + accentH : y;
}

function addBanner(slide, payload, style, y) {
  const height = 1.12;
  slide.addShape("rect", {
    x: 0,
    y,
    w: SLIDE_W,
    h: height,
    fill: { color: style.banner },
  });
  slide.addShape("rect", {
    x: 0,
    y: y + height - 0.05,
    w: SLIDE_W,
    h: 0.05,
    fill: { color: style.accent },
  });

  slide.addText(payload.category.toUpperCase(), {
    x: MARGIN,
    y: y + 0.08,
    w: CONTENT_W,
    h: 0.2,
    fontFace: "Calibri",
    fontSize: 11,
    bold: true,
    color: WHITE,
    charSpacing: 2,
    margin: 0,
  });
  slide.addText(payload.title, {
    x: MARGIN,
    y: y + 0.28,
    w: CONTENT_W,
    h: 0.48,
    fontFace: "Calibri",
    fontSize: titleSize(payload.title),
    bold: true,
    color: WHITE,
    valign: "middle",
    margin: 0,
  });
  slide.addText(departmentLine(payload.department), {
    x: MARGIN,
    y: y + 0.78,
    w: CONTENT_W,
    h: 0.24,
    fontFace: "Calibri",
    fontSize: 12,
    color: "F3E6DC",
    margin: 0,
  });

  return y + height;
}

function addDetailBadges(slide, payload, style, y) {
  const items = [
    payload.date && { label: "Date", value: payload.date },
    payload.time && { label: "Time", value: payload.time },
    payload.venue && { label: "Venue", value: payload.venue },
  ].filter(Boolean);

  if (items.length === 0) return y;

  const gap = 0.12;
  const width = (CONTENT_W - gap * (items.length - 1)) / items.length;
  const height = 0.62;

  items.forEach((item, index) => {
    const x = MARGIN + index * (width + gap);
    slide.addShape("roundRect", {
      x,
      y,
      w: width,
      h: height,
      fill: { color: style.badge },
      line: { color: style.banner, pt: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(
      [
        {
          text: item.label.toUpperCase(),
          options: {
            fontSize: 9,
            bold: true,
            color: style.badgeText,
            breakLine: true,
          },
        },
        {
          text: item.value,
          options: { fontSize: 12, color: INK },
        },
      ],
      {
        x: x + 0.1,
        y: y + 0.06,
        w: width - 0.2,
        h: height - 0.1,
        fontFace: "Calibri",
        valign: "middle",
        margin: 0,
      },
    );
  });

  return y + height;
}

function addCategoryContent(slide, payload, style, y) {
  const footerReserve = FOOTER_H + 0.12;
  const maxY = SLIDE_H - footerReserve;
  const available = Math.max(1.4, maxY - y);

  if (payload.category === "Examination" && payload.subjects.length > 0) {
    return addExaminationContent(slide, payload, style, y, available);
  }

  if (
    (payload.category === "Workshop" || payload.category === "Seminar") &&
    payload.resourcePersons.length > 0
  ) {
    return addPeopleContent(
      slide,
      payload,
      style,
      y,
      available,
      "Resource Persons",
      payload.resourcePersons.map((person) => ({
        title: person.name,
        subtitle: person.designation,
      })),
    );
  }

  if (payload.category === "Placement") {
    return addPlacementContent(slide, payload, style, y, available);
  }

  return addBodyText(slide, payload.noticeBody, y, available);
}

function addExaminationContent(slide, payload, style, y, available) {
  const headingH = 0.28;
  slide.addText("Examination Schedule", {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h: headingH,
    fontFace: "Calibri",
    fontSize: 13,
    bold: true,
    color: style.banner,
    margin: 0,
  });

  const rows = [
    ["Subject", "Date", "Time"].map((heading) => ({
      text: heading,
      options: {
        fill: { color: style.banner },
        color: WHITE,
        bold: true,
        align: "center",
        valign: "middle",
      },
    })),
    ...payload.subjects.slice(0, 8).map((row) => [
      { text: row.subject, options: { color: INK, valign: "middle" } },
      {
        text: row.date,
        options: { color: INK, align: "center", valign: "middle" },
      },
      {
        text: row.time,
        options: { color: INK, align: "center", valign: "middle" },
      },
    ]),
  ];

  const tableH = Math.min(0.38 * rows.length, available - 0.9);
  slide.addTable(rows, {
    x: MARGIN,
    y: y + headingH + 0.06,
    w: CONTENT_W,
    h: tableH,
    colW: [CONTENT_W * 0.5, CONTENT_W * 0.25, CONTENT_W * 0.25],
    border: [
      { pt: 0.5, color: "D5DDE6" },
      { pt: 0.5, color: "D5DDE6" },
      { pt: 0.5, color: "D5DDE6" },
      { pt: 0.5, color: "D5DDE6" },
    ],
    fontFace: "Calibri",
    fontSize: 12,
    color: INK,
  });

  const nextY = y + headingH + tableH + 0.16;
  return addBodyText(
    slide,
    payload.noticeBody,
    nextY,
    Math.max(0.6, y + available - nextY),
  );
}

function addPeopleContent(slide, payload, style, y, available, heading, people) {
  let cursor = addBodyText(
    slide,
    payload.noticeBody,
    y,
    payload.noticeBody ? Math.min(available * 0.45, 1.8) : 0,
  );

  slide.addText(heading, {
    x: MARGIN,
    y: cursor,
    w: CONTENT_W,
    h: 0.28,
    fontFace: "Calibri",
    fontSize: 13,
    bold: true,
    color: style.banner,
    margin: 0,
  });
  cursor += 0.32;

  const shown = people.slice(0, 6);
  const columns = shown.length > 1 ? 2 : 1;
  const gap = 0.12;
  const cardW = columns === 1 ? CONTENT_W : (CONTENT_W - gap) / 2;
  const cardH = 0.62;

  shown.forEach((person, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = MARGIN + col * (cardW + gap);
    const cardY = cursor + row * (cardH + 0.1);

    slide.addShape("roundRect", {
      x,
      y: cardY,
      w: cardW,
      h: cardH,
      fill: { color: style.badge },
      rectRadius: 0.08,
    });
    slide.addShape("rect", {
      x,
      y: cardY,
      w: 0.08,
      h: cardH,
      fill: { color: style.banner },
    });
    slide.addText(
      [
        {
          text: person.title,
          options: { bold: true, fontSize: 13, color: INK, breakLine: true },
        },
        {
          text: person.subtitle || " ",
          options: { fontSize: 11, color: MUTED },
        },
      ],
      {
        x: x + 0.18,
        y: cardY + 0.08,
        w: cardW - 0.28,
        h: cardH - 0.16,
        fontFace: "Calibri",
        valign: "middle",
        margin: 0,
      },
    );
  });

  const rows = Math.ceil(shown.length / columns);
  return cursor + rows * (cardH + 0.1);
}

function addPlacementContent(slide, payload, style, y, available) {
  let cursor = y;

  if (payload.companyName) {
    slide.addShape("roundRect", {
      x: MARGIN,
      y: cursor,
      w: CONTENT_W,
      h: 0.7,
      fill: { color: style.banner },
      rectRadius: 0.08,
    });
    slide.addText(
      [
        {
          text: "RECRUITING ORGANIZATION",
          options: {
            fontSize: 9,
            bold: true,
            color: "F3E6DC",
            breakLine: true,
          },
        },
        {
          text: payload.companyName,
          options: { fontSize: 16, bold: true, color: WHITE },
        },
      ],
      {
        x: MARGIN + 0.18,
        y: cursor + 0.08,
        w: CONTENT_W - 0.36,
        h: 0.54,
        fontFace: "Calibri",
        valign: "middle",
        margin: 0,
      },
    );
    cursor += 0.84;
  }

  if (payload.eligibility) {
    slide.addShape("roundRect", {
      x: MARGIN,
      y: cursor,
      w: CONTENT_W,
      h: 0.58,
      fill: { color: style.badge },
      line: { color: style.banner, pt: 0.75 },
      rectRadius: 0.08,
    });
    slide.addText(
      [
        {
          text: "ELIGIBILITY",
          options: {
            fontSize: 9,
            bold: true,
            color: style.badgeText,
            breakLine: true,
          },
        },
        {
          text: payload.eligibility,
          options: { fontSize: 12, color: INK },
        },
      ],
      {
        x: MARGIN + 0.16,
        y: cursor + 0.06,
        w: CONTENT_W - 0.32,
        h: 0.46,
        fontFace: "Calibri",
        valign: "middle",
        margin: 0,
      },
    );
    cursor += 0.72;
  }

  return addBodyText(
    slide,
    payload.noticeBody,
    cursor,
    Math.max(0.8, y + available - cursor),
  );
}

function addBodyText(slide, noticeBody, y, height) {
  if (!noticeBody || height < 0.35) return y;

  slide.addText(noticeBody, {
    x: MARGIN,
    y,
    w: CONTENT_W,
    h: height,
    fontFace: "Calibri",
    fontSize: bodyFontSize(noticeBody),
    color: INK,
    valign: "top",
    align: "left",
    margin: 0,
  });

  return y + height;
}

function departmentLine(department) {
  if (/^(dept\.?\s+of|department\s+of)\b/i.test(department)) {
    return department;
  }
  return `Department of ${department}`;
}

function titleSize(title) {
  if (title.length > 80) return 15;
  if (title.length > 52) return 17;
  if (title.length > 32) return 19;
  return 22;
}

function bodyFontSize(noticeBody) {
  if (noticeBody.length > 900) return 11;
  if (noticeBody.length > 520) return 12;
  return 13;
}
