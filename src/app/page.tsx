import { redirect } from "next/navigation";
import { HOME_PATH } from "@/config/routes";

export default function Home() {
  redirect(HOME_PATH);
}
