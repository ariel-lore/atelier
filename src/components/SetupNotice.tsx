import { PrismaSetupError } from "@/lib/prismaSetup";

export function SetupNotice({ error }: { error: unknown }) {
  const message = error instanceof PrismaSetupError ? error.message : "The database client needs a refresh.";
  return (
    <div className="empty">
      <h2>Update the local database</h2>
      <p>{message}</p>
    </div>
  );
}

export function isSetupError(error: unknown): error is PrismaSetupError {
  return error instanceof PrismaSetupError;
}
