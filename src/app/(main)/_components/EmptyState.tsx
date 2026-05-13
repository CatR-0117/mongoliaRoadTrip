import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: string;
};

export const EmptyState = ({ title, description, icon = "explore" }: EmptyStateProps) => (
  <Card className="p-10 text-center">
    <div className="mx-auto size-16 rounded-full bg-primary-soft flex items-center justify-center mb-4">
      <Icon name={icon} className="text-primary text-3xl" />
    </div>
    <h3 className="text-lg font-extrabold text-foreground">{title}</h3>
    <p className="text-sm text-muted mt-2 max-w-md mx-auto">{description}</p>
  </Card>
);
