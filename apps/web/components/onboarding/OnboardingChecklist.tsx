import { ChangeEventHandler, useEffect, useState } from "react";
import Link from "next/link";
import Confetti from "react-confetti";
import { useAppSelector } from "src/store";
import { selectUser } from "src/store/user";

import { useForm } from "react-hook-form";

import { Modal } from "components/Modal";

const SLACK_APP_ID = process.env.NEXT_PUBLIC_SLACK_APP_ID;
const SLACK_TEAM_ID = process.env.NEXT_PUBLIC_SLACK_TEAM_ID;
const SLACK_INVITE_LINK = process.env.NEXT_PUBLIC_SLACK_INVITE_LINK;

const buttonStyles =
  "block m-auto mt-4 items-center rounded border border-transparent bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2";

export const OnboardingChecklist = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [agreedToCoC, setAgreedToCoC] = useState(false);
  const closeModal = () => {
    setIsModalOpen(false);
  };
  const openModal = () => {
    setIsModalOpen(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setFocus,
  } = useForm();

  const onSubmit = async (values) => {
    const { magic_word } = values;
    if (magic_word === "strawberry") {
      setAgreedToCoC(true);
      closeModal();
    } else {
      setError("magic_word", {
        type: "wrong_word",
        message: "That's not the magic word!",
      });
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      setFocus("magic_word");
    }
  }, [isModalOpen]);

  const user = useAppSelector(selectUser);
  if (!user) return null;
  const { two_factor_authentication, slack_id } = user;

  const checklistComplete =
    two_factor_authentication && !!slack_id && agreedToCoC;

  if (checklistComplete) {
    return (
      <div className="text-center px-8 rounded-md m-auto mt-12 bg-indigo-100 border border-indigo-500 max-w-fit shadow-md">
        <Confetti />
        <h2 className="text-2xl">You did it! 🎉</h2>
        <p>Thanks for being here.</p>
        <p>
          Your next step is to find a <Link href="/projects">project</Link> to
          contribute.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="text-center">Here's your onboarding checklist:</p>
      <fieldset className="space-y-5 w-fit m-auto">
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
            !!slack_id ? (
              "Your Slack account is connected"
            ) : (
              <>
                <a
                  href={SLACK_INVITE_LINK}
                  target="_blank"
                  rel="noopener noreferer"
                >
                  Join us on Slack
                </a>{" "}
                if you haven't already
              </>
            )
          }
        />
        <ChecklistItem
          checked={agreedToCoC}
          readOnly={false}
          onChange={openModal}
          name="code-of-conduct"
          label={
            <div className="cursor-pointer">
              Read and agree to the{" "}
              <a
                href="https://github.com/hackforla/codeofconduct"
                target="_blank"
                rel="noopener noreferer"
              >
                Code of Conduct
              </a>
            </div>
          }
          description="Look for the magic word in the Code of Conduct"
        />
      </fieldset>
      <Modal {...{ isModalOpen, closeModal }}>
        <p className="text-center">What's the magic word?</p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <input
            {...register("magic_word", {
              required: "You didn't say the magic word.",
            })}
            className="block m-auto text-center"
            type="text"
          />
          <button className={buttonStyles}>Submit</button>
          <p className="text-center h-4 mb-0 text-red-600">
            {errors.magic_word && String(errors.magic_word.message)}
          </p>
        </form>
      </Modal>
    </>
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
  description: any;
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
