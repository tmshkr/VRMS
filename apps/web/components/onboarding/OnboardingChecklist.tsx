export const OnboardingChecklist = () => {
  return (
    <fieldset className="space-y-5 w-fit m-auto">
      <ChecklistItem
        checked={true}
        name="connect-slack"
        label="Connect your account to Slack in the Home tab"
        description={
          true
            ? "Your Slack account is connected"
            : "Watch this video to see how to do it"
        }
      />
      <ChecklistItem
        checked={true}
        name="enable-2fa"
        label="Enable 2FA on your GitHub account"
        description={
          true
            ? "2FA is enabled on your GitHub account"
            : "Enable 2FA on your GitHub account for better security"
        }
      />
      <ChecklistItem
        checked={false}
        name="code-of-conduct"
        label="Read and agree to the Code of Conduct"
        description={`Look for the "key" in the Code of Conduct`}
      />
    </fieldset>
  );
};

const ChecklistItem = ({ checked, name, label, description }) => {
  return (
    <div key={name} className="relative flex items-start">
      <div className="flex h-5 items-center">
        <input
          id={name}
          aria-describedby={`${name}-description`}
          name={name}
          checked={checked}
          type="checkbox"
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
      </div>
      <div className="ml-3 text-sm">
        <label htmlFor={name} className="font-medium text-gray-700">
          {label}
        </label>
        <p id={`${name}-description`} className="text-gray-500">
          {description}
        </p>
      </div>
    </div>
  );
};
