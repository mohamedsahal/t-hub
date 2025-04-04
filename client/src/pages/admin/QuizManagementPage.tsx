import { QuizManagement } from '@/components/dashboard/QuizManagement';
import DashboardLayout from '@/components/layout/DashboardLayout';

export function QuizManagementPage() {
  return (
    <DashboardLayout>
      <div className="container p-6 mx-auto">
        <h1 className="text-3xl font-bold mb-6">Quiz & Exam Management</h1>
        <QuizManagement />
      </div>
    </DashboardLayout>
  );
}

export default QuizManagementPage;