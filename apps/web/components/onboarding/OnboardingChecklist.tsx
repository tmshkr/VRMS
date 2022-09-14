import { ChangeEventHandler } from "react";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";

const SLACK_APP_ID = process.env.NEXT_PUBLIC_SLACK_APP_ID;
const SLACK_TEAM_ID = process.env.NEXT_PUBLIC_SLACK_TEAM_ID;

export const OnboardingChecklist = () => {
  const user = useAppSelector(selectUser);
  if (!user) return null;
  const { two_factor_authentication, slack_id } = user;

  return (
    <fieldset className="space-y-5 w-fit m-auto">
      <ChecklistItem
        checked={!!slack_id}
        name="connect-slack"
        label={
          <>
            Connect your account to Slack in the{" "}
            <a
              href={`slack://app?team=${SLACK_TEAM_ID}&id=${SLACK_APP_ID}&tab=home
        `}
            >
              Home tab
            </a>
          </>
        }
        description={
          !!slack_id
            ? "Your Slack account is connected"
            : "Watch this video to see how to do it"
        }
      />
      <ChecklistItem
        checked={two_factor_authentication}
        name="enable-2fa"
        label="Enable 2FA on your GitHub account"
        description={
          two_factor_authentication
            ? "2FA is enabled on your GitHub account"
            : "Enable 2FA on your GitHub account for better security"
        }
      />
      <ChecklistItem
        checked={false}
        readOnly={false}
        onChange={(e) => console.log(e)}
        name="code-of-conduct"
        label={
          <>
            Read and agree to the{" "}
            <a
              href="https://github.com/hackforla/codeofconduct"
              target="_blank"
              rel="noopener noreferer"
            >
              Code of Conduct
            </a>
          </>
        }
        description="Look for the magic word in the Code of Conduct"
      />
    </fieldset>
  );
};

const ChecklistItem = ({
  checked,
  name,
  label,
  description,
  readOnly = true,
  onChange,
}: {
  checked: boolean;
  name: string;
  label: any;
  description: string;
  readOnly?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
}) => {
  return (
    <div key={name} className="relative flex items-start">
      <div className="flex h-5 items-center">
        <input
          id={name}
          aria-describedby={`${name}-description`}
          name={name}
          checked={checked}
          readOnly={readOnly}
          onChange={onChange}
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
