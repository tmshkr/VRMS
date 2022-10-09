import { NextSeo } from "next-seo";

const CalendarGuidePage = () => {
  return (
    <>
      <NextSeo title="Integrate Google Calendar" />
      <div className="max-w-lg m-auto px-6 py-8 bg-yellow-200 rounded-sm shadow-md">
        <h1 className="text-center">Integrate with Google Calendar</h1>
        <p>
          Meetbot needs to be able to read and write data to your Google
          Calendar in order for it to sync your meetings properly.
        </p>
        <p>
          You can allow this on a per-calendar basis by going into your Google
          Calendar&apos;s <b>Share with specific people</b> settings and
          adding&nbsp;
          <a href="mailto:calendar@meetbot-hq.iam.gserviceaccount.com">
            calendar@meetbot-hq.iam.gserviceaccount.com
          </a>{" "}
          with <b>Make changes to events</b> permissions.
        </p>
        <p>
          You&apos;ll also need your Google Calendar&apos;s ID, which can be
          found under the <b>Integrate calendar</b> heading in your
          calendar&apos;s settings.
        </p>

        <p>Resources</p>
        <ul>
          <li>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://support.google.com/calendar/answer/37082"
            >
              Share your calendar with someone
            </a>
          </li>
          <li>
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://docs.simplecalendar.io/find-google-calendar-id/"
            >
              Finding Your Google Calendar ID
            </a>
          </li>
        </ul>
      </div>
    </>
  );
};

export default CalendarGuidePage;
