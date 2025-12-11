Scavenger Hunt

Executor - Tetiana Shapoval

1. Missing Input Type Validation
Location:
src/api/routes/auth.js, lines ~75–90 (POST /register)

Fault:
The code assumes all inputs (username, email, password, nickname) are strings and directly uses .startsWith() and .trim().
Error:
If client sends { username: {} }, execution throws:
TypeError: username.startsWith is not a function.

Failure:
API returns 500 Internal Server Error instead of 400 Bad Request.
User sees a generic backend crash instead of meaningful validation.

Fix (patch):

+ if (
+   typeof username !== 'string' ||
+   typeof password !== 'string' ||
+   typeof email !== 'string' ||
+   typeof nickname !== 'string'
+ ) {
+   return res.status(400).json({ message: 'Невірний формат полів' });
+ }


2. No Input Normalization (Duplicates Possible)
Location:
POST /register & POST /login — username & email preprocessing.

Fault:
" user ", "User", "user" are treated as different users.
Email saved exactly as provided → inconsistent DB state.
Error:
DB lookup misses existing users due to mismatched whitespace or case.
Failure:
User cannot log in with uppercase version.
Duplicate accounts with the same email.

Fix (patch)

+ const cleanUsername = username.trim();
+ const cleanEmail = email.trim().toLowerCase();
+ const cleanNickname = nickname.trim();


3. Race Condition in Registration (Duplicate Accounts)
Location:
POST /register, around the query:
const exists = await db.query("SELECT ...");
Fault:
Existence check and insert occur separately → two parallel requests both pass the check.
Error:
PostgreSQL throws duplicate key (23505).
Failure:
User receives 500 Database error, not 409 Conflict.


Fix (patch):

} catch (err) {
-  res.status(500).json({ error: 'Database error' });
+  if (err.code === '23505') {
+    return res.status(409).json({
+      message: 'Користувач з таким username або email вже існує'
+    });
+  }
+  return res.status(500).json({ error: 'Internal server error' });
}

4. Incorrect Error Labeling ("DB error" for All Failures)
Location
Catch block in POST /login
Fault
Every error is logged as a DB issue — even when JWT signing or bcrypt comparisons fail.
Error
Logs incorrectly show DB error regardless of real origin.
Failure
Debugging and reliability analysis become misleading.


Fix (patch)

- console.error('DB error (POST /login):', err);
+ console.error('Error in POST /login:', err);


5. Unsafe JWT Secret (Weak Fallback)

Location
Top of the file:
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

Fault:
Server silently uses a weak hardcoded secret.

Error:
All tokens become predictable.
Failure:
Full authentication compromise.


Fix

+ if (!process.env.JWT_SECRET) {
+   throw new Error('JWT_SECRET environment variable is required');
+ }
const JWT_SECRET = process.env.JWT_SECRET;

6. No Length Limits → Possible DoS
Location:
POST /register & POST /login

Fault:
User can send a 1MB string as a password → bcrypt freezes the event loop.
Error:
Huge CPU spike during hash generation.
Failure:
Server becomes unresponsive → denial of service.

Fix:

+ if (
+   cleanUsername.length > 50 ||
+   cleanNickname.length > 50 ||
+   cleanEmail.length > 254 ||
+   password.length > 200
+ ) {
+   return res.status(400).json({ message: 'Занадто довгі вхідні дані' });
+ }



7. No Rate Limiting for /login (Bruteforce Attack)
Location:
Before router.post('/login')
Fault:
Unlimited number of password attempts.

Error:
Attackers spam login endpoint → bcrypt hashing overloads server.
Failure:
Production API slows down or crashes.

Fix:
+ const rateLimit = require('express-rate-limit');
+ const loginLimiter = rateLimit({
+   windowMs: 5 * 60 * 1000,
+   max: 20,
+ });
+
router.post('/login', loginLimiter, async (req, res) => {