import { SiteHeader } from "@/app/(main)/_components/SiteHeader";
import { TripPlanner } from "@/app/(main)/_components/TripPlanner";

const Page = () => (
  <main className="flex flex-col items-stretch min-h-screen">
    <SiteHeader />
    <div className="flex flex-col items-center flex-1">
      <TripPlanner />
    </div>
  </main>
);

export default Page;
