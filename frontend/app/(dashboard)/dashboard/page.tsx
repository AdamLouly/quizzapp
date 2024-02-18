import { QuizOverview } from "@/components/dashboard/quiz-overview";
import { UserActivity } from "@/components/dashboard/user-activity";
import { CalendarDateRangePicker } from "@/components/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function QuizDashboardPage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <Button>Generate Report</Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="userActivity">User Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Quiz Stats Cards - Example: Total Quizzes */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Quizzes</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Example data, replace with actual data */}
                  <div className="text-2xl font-bold">320</div>
                  <CardDescription>New quizzes this month</CardDescription>
                </CardContent>
              </Card>
              {/* Repeat for other metrics like 'Active Users', 'Quizzes Taken', etc. */}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Detailed Overview and User Activity components */}
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Quiz Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <QuizOverview />
                </CardContent>
              </Card>
              <Card className="md:col-span-1">
                <CardHeader>
                  <CardTitle>Recent User Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <UserActivity />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="userActivity">
            {/* Content for user activity across quizzes */}
            <UserActivity />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
