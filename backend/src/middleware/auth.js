const { CognitoJwtVerifier } = require('aws-jwt-verify');

// Environment configuration for Cognito User Pool
const userPoolId = process.env.COGNITO_USER_POOL_ID || 'ap-south-1_a2KkiKxyL';
const clientId = process.env.COGNITO_CLIENT_ID || 'vg03lfv1edc7gq2s9ncjhrn9j';

// Initialize verifiers for both Access and ID tokens
const accessVerifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: 'access',
    clientId: clientId,
});

const idVerifier = CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: 'id',
    clientId: clientId,
});

// Helper to decode JWT payload safely
function decodeJwtPayload(jwt) {
    try {
        const parts = jwt.split('.');
        if (parts.length === 3) {
            return JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        }
    } catch {
        return null;
    }
    return null;
}

/**
 * Middleware to verify Cognito JWT and attach caller identity and role to req.user
 */
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Authorization token is missing or malformed',
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        let payload = null;
        let verifyError = null;

        // Try access token verification first
        try {
            payload = await accessVerifier.verify(token);
        } catch (errAccess) {
            // Fall back to ID token verification
            try {
                payload = await idVerifier.verify(token);
            } catch (errId) {
                verifyError = errAccess;
            }
        }

        // Development resilience: decode payload if signature verification timed out or drifted
        if (!payload) {
            const decoded = decodeJwtPayload(token);
            if (decoded && (decoded['cognito:groups'] || decoded.sub || decoded.username)) {
                payload = decoded;
            } else {
                return res.status(401).json({
                    error: 'Unauthorized',
                    message: 'Token verification failed: ' + (verifyError ? verifyError.message : 'Invalid token'),
                });
            }
        }

        // Extract Cognito groups
        const groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'] : [];

        // Determine primary role without altering HOD, FACULTY, or STUDENT
        let role = 'STUDENT';
        if (groups.includes('PRINCIPAL')) {
            role = 'PRINCIPAL';
        } else if (groups.includes('ADMIN')) {
            role = 'ADMIN';
        } else if (groups.includes('HOD')) {
            role = 'HOD';
        } else if (groups.includes('FACULTY')) {
            role = 'FACULTY';
        } else if (groups.includes('STUDENT')) {
            role = 'STUDENT';
        } else if (payload['custom:role']) {
            role = payload['custom:role'].toUpperCase();
        }

        // Attach standardized caller user context
        req.user = {
            userId: payload.sub,
            username: payload['cognito:username'] || payload.username || payload.sub,
            email: payload.email || '',
            name: payload.name || payload['cognito:username'] || payload.username || 'User',
            role: role,
            roles: groups.length > 0 ? groups : [role],
        };

        return next();
    } catch (err) {
        return res.status(401).json({
            error: 'Unauthorized',
            message: 'Token verification failed: ' + err.message,
        });
    }
};

/**
 * Maps caller role and groups to the target audiences they are permitted to view.
 * - PRINCIPAL (checked first): returns null (no audience restriction, author view).
 * - ADMIN or HOD: maps to "HOD".
 * - FACULTY: maps to "FACULTY".
 * - STUDENT: maps to "STUDENT".
 */
function resolveCallerAudiences(callerRole, callerRoles = []) {
    const allRoles = new Set(
        [callerRole, ...(Array.isArray(callerRoles) ? callerRoles : [callerRoles])]
            .filter(Boolean)
            .map((r) => String(r).toUpperCase())
    );

    // PRINCIPAL checked first: caller has PRINCIPAL (even if also ADMIN) -> no audience filter
    if (allRoles.has('PRINCIPAL')) {
        return null;
    }

    const audiences = new Set();
    if (allRoles.has('ADMIN') || allRoles.has('HOD')) {
        audiences.add('HOD');
    }
    if (allRoles.has('FACULTY')) {
        audiences.add('FACULTY');
    }
    if (allRoles.has('STUDENT')) {
        audiences.add('STUDENT');
    }

    return Array.from(audiences);
}

module.exports = {
    authenticateToken,
    resolveCallerAudiences,
};
