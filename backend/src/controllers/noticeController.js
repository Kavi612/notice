const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const { resolveCallerAudiences } = require('../middleware/auth');

const dataDir = path.join(__dirname, '../../data');
const dataFile = path.join(dataDir, 'notices.json');

// Ensure local fallback data store exists
function ensureDataStore() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(dataFile)) {
        fs.writeFileSync(dataFile, JSON.stringify([], null, 2), 'utf8');
    }
}

function readLocalNotices() {
    ensureDataStore();
    try {
        const raw = fs.readFileSync(dataFile, 'utf8');
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function writeLocalNotices(notices) {
    ensureDataStore();
    fs.writeFileSync(dataFile, JSON.stringify(notices, null, 2), 'utf8');
}

// PostgreSQL connection pool with connection pooling and SSL configuration
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST || 'localhost',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || 'postgres',
    database: process.env.PGDATABASE || 'notice_board',
    port: parseInt(process.env.PGPORT || '5432', 10),
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
});

let postgresOffline = false;
pool.on('error', (err) => {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
        postgresOffline = true;
    }
});

// Helper for database execution with transparent local file fallback
async function executeDb(pgFn, fallbackFn) {
    if (!postgresOffline) {
        try {
            return await pgFn();
        } catch (err) {
            if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
                postgresOffline = true;
                console.warn('[DB] PostgreSQL offline - using local file storage (backend/data/notices.json)');
                return fallbackFn();
            }
            throw err;
        }
    }
    return fallbackFn();
}

const ALLOWED_TARGET_ROLES = ['HOD', 'FACULTY', 'STUDENT'];

function sanitizeForStudent(notice) {
    if (!notice) return null;
    return {
        id: notice.id,
        title: notice.title,
        body: notice.body,
        department: notice.department,
        category: notice.category,
        priority: notice.priority,
        notice_date: notice.notice_date,
        author_name: notice.author_name,
    };
}

/**
 * Create a new notice
 * POST /api/notices
 * Rules:
 * - PRINCIPAL: creates notices targeting any combination of HOD, FACULTY, STUDENT.
 * - HOD / ADMIN: creates notices targeting only FACULTY and STUDENT. Reject HOD with 400.
 * - FACULTY: creates notices targeting only STUDENT. Reject HOD and FACULTY with 400.
 * - STUDENT: cannot create notices. Return 403.
 * - Validates title, body, and target_roles.
 * - Sets author_role to caller's role.
 */
const createNotice = async (req, res) => {
    try {
        const callerRole = (req.user?.role || '').toUpperCase();
        const callerRoles = (req.user?.roles || [callerRole]).map((r) => String(r).toUpperCase());
        const hasPrincipal = callerRoles.includes('PRINCIPAL') || callerRole === 'PRINCIPAL';
        const hasHodOrAdmin = callerRoles.includes('HOD') || callerRoles.includes('ADMIN') || callerRole === 'HOD' || callerRole === 'ADMIN';
        const hasFaculty = callerRoles.includes('FACULTY') || callerRole === 'FACULTY';

        // Check if student or unauthorized role
        if (callerRole === 'STUDENT' || (!hasPrincipal && !hasHodOrAdmin && !hasFaculty)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Students are not allowed to create notices.',
            });
        }

        const {
            title,
            body: rawBody,
            content: rawContent,
            department,
            target_roles: rawTargetRoles,
            targetRoles,
            status = 'PUBLISHED',
            priority = 'REGULAR',
            category = 'GENERAL',
            notice_date,
        } = req.body;

        const body = rawBody || rawContent;

        // Validate title
        if (!title || typeof title !== 'string' || !title.trim()) {
            return res.status(400).json({ error: 'Validation Error', message: 'Title is required' });
        }

        // Validate body
        if (!body || typeof body !== 'string' || !body.trim()) {
            return res.status(400).json({ error: 'Validation Error', message: 'Body is required' });
        }

        // Validate target_roles
        const rawRoles = rawTargetRoles !== undefined ? rawTargetRoles : targetRoles;
        if (!Array.isArray(rawRoles) || rawRoles.length === 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: 'target_roles is required and must be a non-empty array.',
            });
        }

        const normalizedRoles = rawRoles.map((r) => String(r).toUpperCase());
        const invalidRoles = normalizedRoles.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                error: 'Validation Error',
                message: `Invalid target role(s): ${invalidRoles.join(', ')}. Only HOD, FACULTY, and STUDENT are allowed.`,
            });
        }

        // Enforce audience constraints based on creator's role
        if (!hasPrincipal) {
            if (hasHodOrAdmin) {
                // HOD/ADMIN cannot target HOD
                if (normalizedRoles.includes('HOD')) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'HODs cannot target HODs. Allowed targets: FACULTY, STUDENT.',
                    });
                }
            } else if (hasFaculty) {
                // FACULTY can only target STUDENT
                if (normalizedRoles.includes('HOD') || normalizedRoles.includes('FACULTY')) {
                    return res.status(400).json({
                        error: 'Validation Error',
                        message: 'Faculty can only target Students.',
                    });
                }
            }
        }

        const safeTitle = (title || '').trim();
        const safeBody = (body || '').trim();
        const safeDepartment = (department || '').trim() || 'All Departments';
        const safeStatus = String(status || 'PUBLISHED').trim().toUpperCase() === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
        const safePriority = String(priority || 'REGULAR').trim().toUpperCase() === 'URGENT' ? 'URGENT' : 'REGULAR';
        const safeCategory = (String(category || 'GENERAL').trim().toUpperCase()) || 'GENERAL';
        const safeDate = notice_date ? new Date(notice_date) : new Date();

        const authorId = req.user?.userId || `usr_${callerRole.toLowerCase()}`;
        const authorName = req.user?.name || req.user?.username || (hasPrincipal ? 'Office of the Principal' : callerRole);
        const authorRole = hasPrincipal ? 'PRINCIPAL' : hasHodOrAdmin ? 'HOD' : hasFaculty ? 'FACULTY' : callerRole;

        const createdNotice = await executeDb(
            async () => {
                const insertQuery = `
                    INSERT INTO notices (
                        title, body, department, author_id, author_name, author_role,
                        target_roles, status, priority, category, notice_date
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING id, title, body, department, author_id, author_name, author_role,
                              target_roles, status, priority, category, notice_date, created_at, updated_at
                `;
                const values = [
                    safeTitle,
                    safeBody,
                    safeDepartment,
                    authorId,
                    authorName,
                    authorRole,
                    normalizedRoles,
                    safeStatus,
                    safePriority,
                    safeCategory,
                    safeDate,
                ];
                const result = await pool.query(insertQuery, values);
                return result.rows[0];
            },
            () => {
                const noticeItem = {
                    id: 'n_' + Date.now(),
                    title: safeTitle,
                    body: safeBody,
                    department: safeDepartment,
                    author_id: authorId,
                    author_name: authorName,
                    author_role: authorRole,
                    target_roles: normalizedRoles,
                    status: safeStatus,
                    priority: safePriority,
                    category: safeCategory,
                    notice_date: safeDate.toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                const list = readLocalNotices();
                list.unshift(noticeItem);
                writeLocalNotices(list);
                return noticeItem;
            }
        );

        return res.status(201).json({
            message: 'Notice created successfully',
            notice: createdNotice,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Failed to create notice: ' + err.message,
        });
    }
};

/**
 * List notices
 * GET /api/notices
 * Rules:
 * - If scope=my: returns notices authored by req.user.userId.
 * - If caller has PRINCIPAL: returns authored notices by default.
 * - For non-Principal callers (HOD, ADMIN, FACULTY, STUDENT): returns only PUBLISHED notices
 *   where target_roles overlaps caller's resolved audiences (ADMIN/HOD -> HOD, FACULTY -> FACULTY, STUDENT -> STUDENT).
 * - For STUDENT callers: sanitizes output to exclude target_roles, author_id, author_role, status.
 * - Empty audience list returns empty array.
 * - Drafts are visible only to their author.
 */
const getNotices = async (req, res) => {
    try {
        const callerRole = (req.user?.role || 'STUDENT').toUpperCase();
        const callerRoles = (req.user?.roles || [callerRole]).map((r) => String(r).toUpperCase());
        const callerId = req.user?.userId || '';
        const scope = (req.query?.scope || '').toLowerCase();

        const callerAudiences = resolveCallerAudiences(callerRole, callerRoles);
        const isPrincipal = callerAudiences === null;
        const isStudentCaller = callerRole === 'STUDENT' && !callerRoles.some(r => ['PRINCIPAL', 'ADMIN', 'HOD', 'FACULTY'].includes(r));

        if ((scope === 'my' && !isStudentCaller) || (isPrincipal && scope !== 'inbox')) {
            const notices = await executeDb(
                async () => {
                    const query = `
                        SELECT id, title, body, department, author_id, author_name, author_role,
                               target_roles, status, priority, category, notice_date, created_at, updated_at
                        FROM notices
                        WHERE author_id = $1
                        ORDER BY created_at DESC
                    `;
                    const result = await pool.query(query, [callerId]);
                    return result.rows;
                },
                () => {
                    const list = readLocalNotices();
                    return list.filter((n) => String(n.author_id) === String(callerId));
                }
            );
            return res.status(200).json({ notices });
        }

        // Non-Principal audience callers
        if (!callerAudiences || callerAudiences.length === 0) {
            return res.status(200).json({ notices: [] });
        }

        const rawNotices = await executeDb(
            async () => {
                const query = `
                    SELECT id, title, body, department, author_id, author_name, author_role,
                           target_roles, status, priority, category, notice_date, created_at, updated_at
                    FROM notices
                    WHERE status = 'PUBLISHED' AND target_roles && $1::text[]
                    ORDER BY created_at DESC
                `;
                const result = await pool.query(query, [callerAudiences]);
                return result.rows;
            },
            () => {
                const list = readLocalNotices();
                return list.filter(
                    (n) =>
                        n.status === 'PUBLISHED' &&
                        Array.isArray(n.target_roles) &&
                        n.target_roles.some((r) => callerAudiences.includes(String(r).toUpperCase()))
                );
            }
        );

        const notices = isStudentCaller ? rawNotices.map(sanitizeForStudent) : rawNotices;
        return res.status(200).json({ notices });
    } catch (err) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Failed to retrieve notices: ' + err.message,
        });
    }
};

/**
 * Fetch a single notice by ID
 * GET /api/notices/:id
 * Rules:
 * - Allowed if caller is author (author_id = req.user.userId).
 * - Drafts are only accessible to their author (403 otherwise).
 * - Return 404 if the notice does not exist.
 * - Non-author callers are allowed only if notice is PUBLISHED and caller's resolved audience matches target_roles.
 * - For STUDENT callers: sanitizes output to exclude target_roles, author_id, author_role, status.
 * - Otherwise 403.
 */
const getNoticeById = async (req, res) => {
    try {
        const { id } = req.params;
        const callerRole = (req.user?.role || 'STUDENT').toUpperCase();
        const callerRoles = (req.user?.roles || [callerRole]).map((r) => String(r).toUpperCase());
        const callerId = req.user?.userId || '';

        const notice = await executeDb(
            async () => {
                const query = `
                    SELECT id, title, body, department, author_id, author_name, author_role,
                           target_roles, status, priority, category, notice_date, created_at, updated_at
                    FROM notices
                    WHERE id = $1
                `;
                const result = await pool.query(query, [id]);
                return result.rows[0] || null;
            },
            () => {
                const list = readLocalNotices();
                return list.find((n) => String(n.id) === String(id)) || null;
            }
        );

        if (!notice) {
            return res.status(404).json({
                error: 'Not Found',
                message: 'Notice not found',
            });
        }

        const isAuthor = String(notice.author_id) === String(callerId);
        const callerAudiences = resolveCallerAudiences(callerRole, callerRoles);
        const isPrincipal = callerAudiences === null;
        const isStudentCaller = callerRole === 'STUDENT' && !callerRoles.some(r => ['PRINCIPAL', 'ADMIN', 'HOD', 'FACULTY'].includes(r));

        // Draft notices are only accessible to their author
        if (notice.status === 'DRAFT' && !isAuthor) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'Draft notices can only be viewed by their author.',
            });
        }

        // For non-authors: notice must be PUBLISHED and match target_roles audience
        if (!isAuthor) {
            if (notice.status !== 'PUBLISHED') {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Draft notices can only be viewed by their author.',
                });
            }

            const matchesAudience =
                isPrincipal ||
                (Array.isArray(notice.target_roles) &&
                    Array.isArray(callerAudiences) &&
                    notice.target_roles.some((r) => callerAudiences.includes(String(r).toUpperCase())));

            if (!matchesAudience) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'You do not have permission to view this notice.',
                });
            }
        }

        if (isStudentCaller) {
            return res.status(200).json({ notice: sanitizeForStudent(notice) });
        }

        return res.status(200).json({ notice });
    } catch (err) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Failed to retrieve notice: ' + err.message,
        });
    }
};

/**
 * Update an existing notice
 * PUT /api/notices/:id
 * Rules:
 * - Only the author (author_id = req.user.userId) may edit. Otherwise 403.
 * - Return 404 if notice not found.
 * - Any attempt to change author_id is ignored.
 * - Null-safe handling for all string fields in SQL and JSON fallback.
 */
const updateNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user?.userId || '';

        const existingNotice = await executeDb(
            async () => {
                const result = await pool.query('SELECT * FROM notices WHERE id = $1', [id]);
                return result.rows[0] || null;
            },
            () => {
                const list = readLocalNotices();
                return list.find((n) => String(n.id) === String(id)) || null;
            }
        );

        if (!existingNotice) {
            return res.status(404).json({ error: 'Not Found', message: 'Notice not found' });
        }

        if (String(existingNotice.author_id) !== String(callerId)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only edit notices that you authored.',
            });
        }

        // Validate title if supplied
        if (req.body.title !== undefined && (!req.body.title || typeof req.body.title !== 'string' || !req.body.title.trim())) {
            return res.status(400).json({ error: 'Validation Error', message: 'Title cannot be empty.' });
        }

        const {
            title = existingNotice.title,
            body: rawBody,
            content: rawContent,
            department = existingNotice.department,
            status = existingNotice.status,
            priority = existingNotice.priority,
            category = existingNotice.category,
            notice_date = existingNotice.notice_date,
            // author_id from req.body is deliberately destructured and ignored
            author_id: _ignoredAuthorId,
        } = req.body;

        const body = rawBody || rawContent || existingNotice.body;

        // Validate target_roles if supplied
        let normalizedRoles = existingNotice.target_roles;
        const incomingUpdateRoles = req.body.target_roles !== undefined ? req.body.target_roles : req.body.targetRoles;
        if (incomingUpdateRoles !== undefined) {
            if (!Array.isArray(incomingUpdateRoles) || incomingUpdateRoles.length === 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: 'target_roles must be a non-empty array containing at least one of HOD, FACULTY, STUDENT.',
                });
            }
            const normalized = incomingUpdateRoles.map((r) => String(r).toUpperCase());
            const invalid = normalized.filter((r) => !ALLOWED_TARGET_ROLES.includes(r));
            if (invalid.length > 0) {
                return res.status(400).json({
                    error: 'Validation Error',
                    message: `Invalid target role(s): ${invalid.join(', ')}. Only HOD, FACULTY, and STUDENT are allowed.`,
                });
            }
            normalizedRoles = normalized;
        }

        const safeTitle = (title || '').trim();
        const safeBody = (body || '').trim();
        const safeDepartment = (department || '').trim() || existingNotice.department || 'All Departments';
        const safeStatus = String(status || existingNotice.status || 'PUBLISHED').trim().toUpperCase();
        const safePriority = String(priority || existingNotice.priority || 'REGULAR').trim().toUpperCase();
        const safeCategory = String(category || existingNotice.category || 'GENERAL').trim().toUpperCase();
        const safeDate = notice_date ? new Date(notice_date) : new Date(existingNotice.notice_date || Date.now());

        const updatedNotice = await executeDb(
            async () => {
                const updateQuery = `
                    UPDATE notices
                    SET title = $1, body = $2, department = $3, target_roles = $4,
                        status = $5, priority = $6, category = $7, notice_date = $8,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $9
                    RETURNING id, title, body, department, author_id, author_name, author_role,
                              target_roles, status, priority, category, notice_date, created_at, updated_at
                `;
                const values = [
                    safeTitle,
                    safeBody,
                    safeDepartment,
                    normalizedRoles,
                    safeStatus,
                    safePriority,
                    safeCategory,
                    safeDate,
                    id,
                ];
                const updateResult = await pool.query(updateQuery, values);
                return updateResult.rows[0];
            },
            () => {
                const list = readLocalNotices();
                const index = list.findIndex((n) => String(n.id) === String(id));
                if (index !== -1) {
                    list[index] = {
                        ...list[index],
                        title: safeTitle,
                        body: safeBody,
                        department: safeDepartment,
                        // Always keep original author identity, ignoring any incoming change
                        author_id: existingNotice.author_id,
                        author_name: existingNotice.author_name,
                        author_role: existingNotice.author_role,
                        target_roles: normalizedRoles,
                        status: safeStatus,
                        priority: safePriority,
                        category: safeCategory,
                        notice_date: safeDate.toISOString(),
                        updated_at: new Date().toISOString(),
                    };
                    writeLocalNotices(list);
                    return list[index];
                }
                return existingNotice;
            }
        );

        return res.status(200).json({
            message: 'Notice updated successfully',
            notice: updatedNotice,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Failed to update notice: ' + err.message,
        });
    }
};

/**
 * Delete a notice
 * DELETE /api/notices/:id
 * Rules:
 * - Only the author (author_id = req.user.userId) may delete. Otherwise 403.
 * - Return 404 if notice not found.
 */
const deleteNotice = async (req, res) => {
    try {
        const { id } = req.params;
        const callerId = req.user?.userId || '';

        const existingNotice = await executeDb(
            async () => {
                const result = await pool.query('SELECT * FROM notices WHERE id = $1', [id]);
                return result.rows[0] || null;
            },
            () => {
                const list = readLocalNotices();
                return list.find((n) => String(n.id) === String(id)) || null;
            }
        );

        if (!existingNotice) {
            return res.status(404).json({ error: 'Not Found', message: 'Notice not found' });
        }

        if (String(existingNotice.author_id) !== String(callerId)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: 'You can only delete notices that you authored.',
            });
        }

        await executeDb(
            async () => {
                await pool.query('DELETE FROM notices WHERE id = $1', [id]);
            },
            () => {
                const list = readLocalNotices();
                writeLocalNotices(list.filter((n) => String(n.id) !== String(id)));
            }
        );

        return res.status(200).json({
            message: 'Notice deleted successfully',
            deletedId: id,
        });
    } catch (err) {
        return res.status(500).json({
            error: 'Server Error',
            message: 'Failed to delete notice: ' + err.message,
        });
    }
};

module.exports = {
    pool,
    getNotices,
    listNotices: getNotices,
    getNoticeById,
    createNotice,
    updateNotice,
    deleteNotice,
};
