<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Developer Agent Guidelines: sapaai (Frontend)

This document serves as the system rules and operational constraints for AI agents pair-programming on the `sapaai` Next.js / TypeScript frontend repository.

---

## 1. Project Rules & Workflow
1. **Understand Environment**: The project operates on Next.js, TypeScript, and **Bun** (e.g., `bun dev`, `bun run build`, `bun add`). Always run dev server, builds, and linting commands using Bun scripts in the repository context.
2. **Work Tracking**:
   - Create or update implementation plans under `.implementation/your_llmname/(number)-(description).md`.
   - Update development roadmaps under `.roadmap/your_llmname/(number)-(description).md`.
   - Refer to and keep API client integrations aligned with [APIDOCS.md](file:///home/hylmi/Hylmi/Pemrograman_Berorientasi_Objek/TypeScript/sapaai/APIDOCS.md).

---

## 2. Coding & API Standards
1. **API Envelope Integration**:
   - All backend API responses follow structured JSON envelopes:
     ```json
     {
       "success": true,
       "data": { ... }
     }
     ```
     and for errors:
     ```json
     {
       "success": false,
       "message": "Detailed error context"
     }
     ```
   - Standardize client-side API calls and handle loading, data display, and error envelopes cleanly across UI components.
2. **Component & Design Standards**:
   - Use TypeScript strictly for all components, routes, hooks, and types.
   - Utilize UI components and styling from `@astryxdesign/core`, `@astryxdesign/theme-neutral`, and Tailwind CSS.
   - Maintain modern, responsive UI design patterns, clean error handling, and accessible UI feedback.

---

## 3. Testing & Verification
1. **Build & Lint Verification**: Ensure code compiles without TypeScript or Next.js build errors by running `bun run build` and `bun run lint`.
2. **Component & Unit Testing**: Write tests for utilities, hooks, and component logic colocated alongside the target source modules.
