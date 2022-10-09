import { NextSeo } from "next-seo";

const AdminPage = (props) => {
  return (
    <>
      <NextSeo title="Admin" />
      <h1>Admin</h1>
    </>
  );
};

AdminPage.auth = {
  allowedRoles: ["ADMIN"],
};

export default AdminPage;
