import { redirect } from "next/navigation"

export default function FDDIndexPage() {
  // Redirect to My FDDs page if someone accesses /fdd without a slug
  redirect("/hub/my-fdds")
}
