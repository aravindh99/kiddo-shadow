import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Alert,
  Box,
  Button,
  TextField,
  Stack,
  Typography,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { PhotoCamera, Delete } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { completeProfileApi, uploadProfilePicture } from "../modules/profile/profile.api";
import { createImagePreview, revokeImagePreview } from "../utils/imageUtils";
import { normalizeTitleCaseFields, toTitleCase } from "../utils/textFormat";

const STUDENT_STEPS = ["Personal", "Family", "Contact"];
const TEACHER_STEPS = ["Personal", "Professional"];
const TITLE_CASE_FIELDS = [
  "name",
  "father_name",
  "mother_name",
  "guardian_name",
  "father_occupation",
  "mother_occupation",
  "designation",
];
const PHONE_MAX_LENGTH = 10;

export default function FirstLoginPage() {
  const { user, login, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const isStudent = user?.role === "student";
  const isTeacher = user?.role === "teacher";
  const steps = isStudent ? STUDENT_STEPS : isTeacher ? TEACHER_STEPS : [];
  const visibleSteps =
    isMobile && isStudent
      ? ["Personal", "Family", "Contact"]
      : steps;

  const [formData, setFormData] = useState({
    // Personal
    name: toTitleCase(user?.name || ""),
    dob: "",
    gender: "",
    phone: "",
    email: "",

    // Student Family (if student)
    father_name: "",
    mother_name: "",
    guardian_name: "",
    father_occupation: "",
    mother_occupation: "",
    family_income: "",
    address: "",

    // Teacher Professional (if teacher)
    designation: "",
    qualification: "",
    experience: "",
    joining_date: "",
  });

  // Check if user is on first login
  useEffect(() => {
    if (user && !user.first_login) {
      const rolePath = `/${user.role}/dashboard`;
      navigate(rolePath, { replace: true });
    }
  }, [user, navigate]);

  function handleInputChange(field, value) {
    if (field === "phone") {
      const sanitizedPhone = value.replace(/\D/g, "").slice(0, PHONE_MAX_LENGTH);
      setFormData((prev) => ({
        ...prev,
        phone: sanitizedPhone,
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [field]: TITLE_CASE_FIELDS.includes(field) ? toTitleCase(value) : value,
    }));
  }

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setError(null);
      setUploading(true);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
      }

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        throw new Error("File size too large. Maximum size: 10MB");
      }

      // Create preview
      const preview = createImagePreview(file);
      setPreviewUrl(preview);
      setAvatarFile(file);

      // Upload the file
      const uploadedUrl = await uploadProfilePicture(file, user.id);
      setAvatarUrl(uploadedUrl);

      // Clean up preview
      revokeImagePreview(preview);
      setPreviewUrl(null);
    } catch (uploadError) {
      setError(`Avatar upload failed: ${uploadError.message}`);

      // Clean up on error
      if (previewUrl) {
        revokeImagePreview(previewUrl);
        setPreviewUrl(null);
      }
      setAvatarFile(null);
    } finally {
      setUploading(false);
    }

    // Clear file input
    e.target.value = '';
  }

  function handleAvatarDelete() {
    if (previewUrl) {
      revokeImagePreview(previewUrl);
    }
    setPreviewUrl(null);
    setAvatarFile(null);
    setAvatarUrl(null);
  }

  async function handleNext() {
    if (activeStep === 0) {
      if (!formData.name?.trim()) {
        setError("Full Name is required");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (!formData.phone?.trim()) {
        setError("Phone Number is required");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (formData.phone.length < 10) {
        setError("Please enter a valid 10-digit Phone Number");
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      if (formData.email && formData.email.trim() !== "") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
          setError("Please enter a valid email address");
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }
      setError(null);
    }

    if (activeStep === steps.length - 1 || steps.length === 0) {
      // Submit form
      await handleSubmit();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  }


  function handleBack() {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      let submitData = {
        ...formData,
        family_income: formData.family_income ? parseFloat(formData.family_income) : 0,
        experience: formData.experience ? parseInt(formData.experience) : 0,
      };

      submitData = normalizeTitleCaseFields(submitData, TITLE_CASE_FIELDS);

      // Add avatar URL if uploaded
      if (avatarUrl) {
        submitData.avatar_url = avatarUrl;
      }

      // Remove empty fields
      Object.keys(submitData).forEach((key) => {
        if (submitData[key] === "" || submitData[key] === null) {
          delete submitData[key];
        }
      });

      const response = await completeProfileApi(user.role, submitData);

      // Update session with new token (if provided)
      const returnedToken = response?.data?.token || response?.token || null;
      if (returnedToken) {
        login(returnedToken);
      } else {
        updateUser({ first_login: false });
      }

      // Profile completed successfully
      const fromPath = location.state?.from?.pathname;
      const rolePath = `/${user.role}/dashboard`;
      navigate(fromPath || rolePath, { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  const currentAvatarUrl = previewUrl || avatarUrl;
  const hasAvatar = Boolean(currentAvatarUrl);

  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
            Complete Your Profile
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Stepper */}
          <Box sx={{ mb: 4, pb: 0.5 }}>
            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={{
                width: "100%",
                "& .MuiStepLabel-label": {
                  fontSize: { xs: "0.7rem", sm: "0.875rem" },
                  fontWeight: 600,
                  mt: 0.5,
                  whiteSpace: "nowrap",
                },
                "& .MuiStepIcon-root": {
                  fontSize: { xs: 22, sm: 24 },
                },
                "& .MuiStep-root": {
                  px: { xs: 0.25, sm: 1 },
                },
                "& .MuiStepLabel-labelContainer": {
                  minWidth: 0,
                },
                "& .MuiStepConnector-root": {
                  left: { xs: "calc(-50% + 10px)", sm: "calc(-50% + 12px)" },
                  right: { xs: "calc(50% + 10px)", sm: "calc(50% + 12px)" },
                },
              }}
            >
              {visibleSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <Stack spacing={3}>
            {/* Personal Step */}
            {activeStep === 0 && (
              <Stack spacing={2}>
                {/* Avatar Upload Section */}
                <Box sx={{ textAlign: "center" }}>
                  <Box position="relative" display="inline-block">
                    <Avatar
                      src={currentAvatarUrl}
                      sx={{
                        width: 120,
                        height: 120,
                        mx: "auto",
                        mb: 2,
                        border: 2,
                        borderColor: 'primary.main',
                        borderStyle: uploading ? 'dashed' : 'solid'
                      }}
                    >
                      {uploading && (
                        <CircularProgress
                          size={100}
                          sx={{
                            position: 'absolute',
                            color: 'primary.main'
                          }}
                        />
                      )}
                    </Avatar>

                    {uploading && (
                      <Box
                        position="absolute"
                        top="50%"
                        left="50%"
                        sx={{ transform: 'translate(-50%, -50%)' }}
                      >
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
                    <Button
                      component="label"
                      variant="outlined"
                      startIcon={<PhotoCamera />}
                      disabled={uploading}
                      size="small"
                    >
                      {hasAvatar ? 'Change Photo' : 'Add Photo'}
                      <input
                        hidden
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleAvatarChange}
                      />
                    </Button>

                    {hasAvatar && (
                      <IconButton
                        onClick={handleAvatarDelete}
                        disabled={uploading}
                        color="error"
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    )}
                  </Stack>

                  <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                    <Chip label="Max 10MB" size="small" variant="outlined" />
                    <Chip label="JPEG, PNG, WebP" size="small" variant="outlined" />
                  </Stack>

                  {uploading && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Uploading image...
                    </Typography>
                  )}
                </Box>

                <TextField
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  fullWidth
                  required
                />

                <TextField
                  label="Date of Birth"
                  type="date"
                  value={formData.dob}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <TextField
                  select
                  value={formData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  fullWidth
                  SelectProps={{ native: true, displayEmpty: true }}
                  inputProps={{ "aria-label": "Gender" }}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </TextField>

                <TextField
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  fullWidth
                  required
                  inputProps={{
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                    maxLength: PHONE_MAX_LENGTH,
                  }}
                />

                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  fullWidth
                />
              </Stack>
            )}

            {/* Student Family Info */}
            {isStudent && activeStep === 1 && (
              <Stack spacing={2}>
                <TextField
                  label="Father's Name"
                  value={formData.father_name}
                  onChange={(e) => handleInputChange("father_name", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Father's Occupation"
                  value={formData.father_occupation}
                  onChange={(e) => handleInputChange("father_occupation", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Mother's Name"
                  value={formData.mother_name}
                  onChange={(e) => handleInputChange("mother_name", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Mother's Occupation"
                  value={formData.mother_occupation}
                  onChange={(e) => handleInputChange("mother_occupation", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Guardian Name (if applicable)"
                  value={formData.guardian_name}
                  onChange={(e) => handleInputChange("guardian_name", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Family Annual Income"
                  type="number"
                  value={formData.family_income}
                  onChange={(e) => handleInputChange("family_income", e.target.value)}
                  fullWidth
                  inputProps={{ step: "0.01" }}
                />
              </Stack>
            )}

            {/* Student Contact Info */}
            {isStudent && activeStep === 2 && (
              <Stack spacing={2}>
                <TextField
                  label="Address"
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                />

                <Alert severity="info">
                  Your teacher will need to approve this profile before you can access all features.
                </Alert>
              </Stack>
            )}

            {/* Teacher Professional Info */}
            {isTeacher && activeStep === 1 && (
              <Stack spacing={2}>
                <TextField
                  label="Designation"
                  value={formData.designation}
                  onChange={(e) => handleInputChange("designation", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Qualification"
                  value={formData.qualification}
                  onChange={(e) => handleInputChange("qualification", e.target.value)}
                  fullWidth
                />

                <TextField
                  label="Years of Experience"
                  type="number"
                  value={formData.experience}
                  onChange={(e) => handleInputChange("experience", e.target.value)}
                  fullWidth
                />
              </Stack>
            )}
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading || uploading}
              fullWidth
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading || uploading}
              fullWidth
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : (activeStep === steps.length - 1 || steps.length === 0) ? (
                "Complete"
              ) : (
                "Next"
              )}
            </Button>
          </Stack>

          <Button
            onClick={() => logout()}
            fullWidth
            variant="text"
            sx={{ mt: 2 }}
            disabled={loading || uploading}
          >
            Logout
          </Button>
        </Paper>
      </Box>
    </Container>
  );
}
