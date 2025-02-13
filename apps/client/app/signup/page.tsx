import AuthCard from "@/components/authCard";

export default function Signup() {
  //TODO: Update Router Logic To update when changing tabs
  return (
    <div className="max-w-[1000px] my-0 mx-auto py-0 px-[40px] flex justify-center items-center h-full mt-40">
      <AuthCard createAccount={true} />;
    </div>
  );
}
