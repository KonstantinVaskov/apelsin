import { Suspense } from "react";
import { FamilyClient } from "./family-client";

function Fallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

export default function FamilyPage() {
  return (
    <Suspense fallback={<Fallback />}>
      <FamilyClient />
    </Suspense>
  );
}
