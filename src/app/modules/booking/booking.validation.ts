import z, { date } from "zod";
const bookingRequest = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required!",
    }),
    description: z.string({
      required_error: "Description is required!",
    }),
    weight: z.number({
      required_error: "Weight is required!",
    }),
    price: z.number({
      required_error: "Price is required!",
    }),
    image: z.string({
      required_error: "Image is required!",
    }),
  }),
});

export const BookingValidations = {
  bookingRequest,
};
