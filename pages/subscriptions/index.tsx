import { AA_SubscriptionList } from "@/components/aa_subscription_list";
import { NextPage } from "next";

const SubscriptionsPage: NextPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Manage Subscriptions</h1>
      <AA_SubscriptionList />
    </div>
  );
};

export default SubscriptionsPage;