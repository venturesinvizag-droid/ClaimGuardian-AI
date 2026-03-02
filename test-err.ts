import bcrypt from "bcryptjs";

async function test() {
  try {
    await bcrypt.hash(undefined as any, 10);
  } catch (err: any) {
    console.log("Error type:", typeof err);
    console.log("Error message:", err.message);
    console.log("Has includes?", typeof err.message?.includes);
  }
}
test();
