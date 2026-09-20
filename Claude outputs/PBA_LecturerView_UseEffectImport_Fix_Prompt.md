# PBA Full-Time Portal — LecturerManagementView: Fix Missing useEffect Import
## AntiGravity Prompt

---

```
LecturerManagementView.jsx crashes with "Can't find variable: useEffect"
because useEffect is used in the component but is missing from the
React import at the top of the file.

Touch ONLY LecturerManagementView.jsx.
Do NOT change any other file.

════════════════════════════════════════════════════════════════
THE FIX — Add useEffect to the React import
════════════════════════════════════════════════════════════════

Find the import line at the very top of LecturerManagementView.jsx.
It currently looks like one of:

  import React, { useState } from 'react';
  import React, { useState, useCallback } from 'react';
  import { useState } from 'react';

CHANGE IT to include useEffect (and useMemo if also missing):

  import React, { useState, useEffect, useMemo } from 'react';

If useCallback or other hooks are already imported, keep them:

  import React, { useState, useEffect, useMemo, useCallback } from 'react';

RULE: include every React hook that is actually called anywhere
in the file — useState, useEffect, useMemo, useCallback, useRef —
in a single import line. Remove any that are NOT used in the file
to avoid unused-variable warnings.

════════════════════════════════════════════════════════════════
IMPORTANT NOTES
════════════════════════════════════════════════════════════════

1. Touch ONLY LecturerManagementView.jsx
2. Change ONLY the import line — do not modify anything else
3. Run npm run build and confirm 0 errors
4. Then npm run deploy to push to GitHub and trigger Vercel
5. List all files modified
```
