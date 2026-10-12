import asyncHandler from "../../shared/asyncHandler.js";
import {
  createSchoolService,
  getSchoolDetailsService,
  listSchoolsService,
  updateSchoolService,
  updateSchoolStatusService,
  updateSchoolAdminStatusService,
  resetSchoolAdminPasswordService,
  updateSchoolBrandingService,
} from "./school.service.js";

/* CREATE SCHOOL */
export const createSchool = asyncHandler(async (req, res) => {
  const result = await createSchoolService(req.body);
  res.status(201).json(result);
});

/* UPDATE SCHOOL */
export const updateSchool = asyncHandler(async (req, res) => {
  const result = await updateSchoolService({
    school_id: req.params.id,
    ...req.body,
  });
  res.json({ message: "School updated", ...result });
});

/* LIST SCHOOLS */
export const listSchools = asyncHandler(async (req, res) => {
  const schools = await listSchoolsService({ query: req.query });
  res.json(schools);
});

/* UPDATE SCHOOL STATUS */
export const updateSchoolStatus = asyncHandler(async (req, res) => {
  const school = await updateSchoolStatusService({
    school_id: req.params.id,
    status: req.body.status,
  });

  res.json({ message: "Status updated", school });
});

/* UPDATE SCHOOL ADMIN STATUS */
export const updateSchoolAdminStatus = asyncHandler(async (req, res) => {
  const admin = await updateSchoolAdminStatusService({
    school_id: req.params.id,
    is_active: req.body.is_active,
  });

  res.json({ message: "School admin status updated", admin });
});

/* RESET SCHOOL ADMIN PASSWORD */
export const resetSchoolAdminPassword = asyncHandler(async (req, res) => {
  const result = await resetSchoolAdminPasswordService({
    school_id: req.params.id,
    new_password: req.body.new_password,
  });

  res.json({ message: "Password reset", admin: result });
});

/* SCHOOL DETAILS */
export const getSchoolDetails = asyncHandler(async (req, res) => {
  const school = await getSchoolDetailsService({
    requester: req.user,
    school_id: req.params.id,
  });

  res.json({
    success: true,
    data: school,
  });
});

/* UPDATE SCHOOL BRANDING */
export const updateSchoolBranding = asyncHandler(async (req, res) => {
  const school_id = req.user.school_id;
  if (!school_id) {
    return res.status(403).json({ message: "Forbidden: No school context" });
  }

  const school_name = req.body.school_name;
  if (school_name && !/^[A-Za-z\s]+$/.test(school_name)) {
    return res.status(400).json({ message: "School name can contain only letters and spaces." });
  }

  const school = await updateSchoolBrandingService({
    school_id,
    school_name,
    logo_file: req.files && req.files.length > 0 ? req.files[0] : null,
    remove_logo: req.body.remove_logo,
  });

  res.json({
    success: true,
    message: "School branding updated successfully",
    data: school,
  });
});

/* GET MY SCHOOL BRANDING */
export const getMySchoolBranding = asyncHandler(async (req, res) => {
  const school_id = req.user?.school_id;
  if (!school_id) {
    return res.status(403).json({ message: "No school associated with this user." });
  }

  const school = await getSchoolDetailsService({ requester: req.user, school_id });
  if (!school) {
    return res.status(404).json({ message: "School not found." });
  }

  res.json({
    success: true,
    data: {
      school_name: school.school_name,
      logo_url: school.logo_url
    },
  });
});
