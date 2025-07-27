# AutogensocialSwa

This project is a full-stack Angular + Azure Static Web App, with API and models auto-generated from an OpenAPI spec.

## Project Structure

- `src/` — Angular frontend
- `api/` — Azure Functions backend
- `src/app/generated/models.ts` — Auto-generated TypeScript models for frontend
- `api/generated/models.ts` — Auto-generated TypeScript models for backend
- `../specs/openapi.yaml` — Source of truth for API and models (in the `specs/` folder at the repo root)

## OpenAPI-Driven Model Generation

TypeScript models for both frontend and backend are auto-generated from the OpenAPI spec. This ensures type safety and keeps your code in sync with the API contract.

### How to Regenerate Models

1. Make sure your OpenAPI spec is up to date at `../specs/openapi.yaml`.
2. From the `static-web-app` project root, run:

```bash
npm run generate:models:all
```

This will:
- Generate `api/generated/models.ts` for the backend
- Generate `src/app/generated/models.ts` for the frontend

Both files are overwritten each time you run the script.

### Scripts

- `npm run generate:models:all` — Generate models for both frontend and backend
- `npm run generate:types` — Generate OpenAPI types for frontend only

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Azure Static Web Apps

This project is designed to be deployed as an Azure Static Web App. The backend API is implemented as Azure Functions in the `api/` directory.

## Additional Resources

- [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli)
- [openapi-typescript](https://github.com/drwpow/openapi-typescript)
- [Azure Static Web Apps Documentation](https://learn.microsoft.com/azure/static-web-apps/)

Update to README.md