# **App Name**: GitDrive

## Core Features:

- GitHub Authentication: Enable users to log in securely using OAuth2 via their GitHub accounts, ensuring secure file access. Support GitHub Enterprise.
- Secure File Upload: Securely upload files directly to the user’s specified GitHub repository with options to automatically create folders and scan files for viruses.
- Folder & File Management: Allow users to create, rename, and delete folders; reorder files with drag-and-drop; and manage file versions through commit history. Optionally generate or customize Git commit messages using an AI tool.
- Public CDN Links: Generate and preview raw.githubusercontent.com URLs with QR codes and one-click copy for easy sharing and embedding.
- RBAC Dashboard: Provide a role-based access control dashboard with roles like Owner, Admin, Editor, and Viewer. Include permissions management for uploads, deletions, views, sharing, and access control, with audit logs for security and transparency.

## Style Guidelines:

- Primary color: Deep Blue (#3498db), chosen to inspire trust, and to align the product with SaaS conventions. The hue is shifted somewhat more toward azure than is typical.
- Accent color: Green (#2ecc71) for CTAs, chosen for clarity.
- Background color: Light Gray (#ecf0f1), to visually evoke a clean workspace. Desaturated and fairly bright.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look.
- Use minimalist line icons for different file types (e.g., PDF, DOC, PNG).
- Implement a sidebar navigation alongside a responsive grid or table for managing file structures.
- Include optional dark mode for power users.