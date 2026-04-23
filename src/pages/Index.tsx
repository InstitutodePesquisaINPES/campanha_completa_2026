import { AppLayout } from "@/components/layout/AppLayout";
import { RoleBasedDashboard } from "@/components/dashboard/RoleBasedDashboard";

export default function Index() {
  return (
    <AppLayout>
      <RoleBasedDashboard />
    </AppLayout>
  );
}
