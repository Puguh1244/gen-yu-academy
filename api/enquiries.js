import { enquiryApi } from "../server/enquiry-api.js";

export default function handler(req, res) {
  return enquiryApi(req, res, process.env);
}
