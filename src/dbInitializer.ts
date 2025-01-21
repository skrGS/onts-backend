import { User } from "./db/Users";
import { authentication, random } from "./helpers";
/**
 * @author tushig
 */

export const initDatabase = async () => {
  const existingAdminUser = await User.findOne({ phone: "94581158" });
  if (!existingAdminUser) {
    const salt = random();
    const hashedPassword = authentication(salt, "Tushig123");

    const newAdminUser = new User({
      phone: "94581158",
      authentication: {
        password: hashedPassword,
        salt: salt,
      },
      roleName: "ADMIN",
      sessionScope: "AUTHORIZED",
    });

    await newAdminUser.save();
    console.log("Default Admin user created");
  }
};
