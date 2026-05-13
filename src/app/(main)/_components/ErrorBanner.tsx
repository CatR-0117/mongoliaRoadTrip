import { Icon } from "@/components/ui/Icon";

type ErrorBannerProps = {
  title: string;
  message: string;
  onRetry?: () => void;
};

export const ErrorBanner = ({ title, message, onRetry }: ErrorBannerProps) => (
  <div className="w-full max-w-[1200px] mx-auto px-4 md:px-10 mt-4">
    <div className="bg-white border border-danger/30 text-foreground rounded-xl p-4 flex items-start gap-3 shadow-sm">
      <div className="size-9 rounded-full bg-danger/10 text-danger flex items-center justify-center shrink-0">
        <Icon name="error" />
      </div>
      <div className="flex-1">
        <h4 className="text-sm font-extrabold">{title}</h4>
        <p className="text-sm text-muted mt-0.5">{message}</p>
      </div>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="text-sm font-bold text-primary hover:underline shrink-0"
        >
          Try again
        </button>
      ) : null}
    </div>
  </div>
);
