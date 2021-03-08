import { checkSchema } from "express-validator";
export const packageCentralDeliverySchema = checkSchema({
  packageIDs: {
    custom: {
      options: (value, { req, location, path }) => {
        let validParameter = true;
        if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item !== "string") {
                    validParameter = false
                }
            }
        } else {
            validParameter = false;
        }
        return validParameter
          ? Promise.resolve()
          : Promise.reject("packageIDs parameter invalid");
      },
    },
    in: ["body"],
    errorMessage: "packageIDs invalid",
    isArray: true,
  },
  fakeScenario: {
    in: ["body"],
    optional: { options: { nullable: true } },
    errorMessage: "fakeScenario invalid",
    isBoolean: true,
    toBoolean: true,
  },
});
