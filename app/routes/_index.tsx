import { redirect } from "react-router";
import type { LoaderFunctionArgs } from "react-router";
import { getUserFromRequest } from "~/modules/authentication/authentication.server";

export async function loader({ request }: LoaderFunctionArgs) {
  const user = getUserFromRequest(request);
  return redirect(user ? "/dashboard" : "/auth/login");
}

export default function IndexRoute() {
  return null;
}
