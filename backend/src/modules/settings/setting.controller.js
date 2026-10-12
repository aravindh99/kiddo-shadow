import SystemSetting from "./setting.model.js";
import path from "path";
import fs from "fs";

const GLOBAL_LOGO_KEY = "global_logo";

const buildSettingsMap = async () => {
  const settings = await SystemSetting.findAll();
  const settingsMap = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });
  return settingsMap;
};

const removeGlobalLogoFile = (logoPath) => {
  if (!logoPath) return;

  try {
    const cleanLogoPath = logoPath.split("?")[0];
    if (!cleanLogoPath.startsWith("/uploads/global/branding/")) return;

    const oldFilename = cleanLogoPath.split("/").pop();
    if (!oldFilename) return;

    const oldFilepath = path.join(process.cwd(), "uploads", "global", "branding", oldFilename);
    if (fs.existsSync(oldFilepath)) {
      fs.unlinkSync(oldFilepath);
    }
  } catch (err) {
    console.error("Error removing old global logo file:", err);
  }
};

// Fetch global settings
export const getGlobalSettings = async (req, res, next) => {
  try {
    const settingsMap = await buildSettingsMap();

    res.status(200).json({
      success: true,
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

// Update global logo
export const updateGlobalLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No logo file provided" });
    }

    const logoPath = `/uploads/global/branding/${req.file.filename}`;

    const oldLogoSetting = await SystemSetting.findOne({ where: { key: GLOBAL_LOGO_KEY } });

    await SystemSetting.upsert({
      key: GLOBAL_LOGO_KEY,
      value: logoPath,
    });

    removeGlobalLogoFile(oldLogoSetting?.value);
    const settingsMap = await buildSettingsMap();

    res.status(200).json({
      success: true,
      message: "Global logo updated successfully",
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};

// Update global settings generically
export const updateGlobalSettings = async (req, res, next) => {
  try {
    const { platform_name, remove_logo } = req.body;

    if (platform_name) {
      await SystemSetting.upsert({
        key: "platform_name",
        value: platform_name,
      });
    }

    if (remove_logo === true || remove_logo === "true") {
      const oldLogoSetting = await SystemSetting.findOne({ where: { key: GLOBAL_LOGO_KEY } });
      await SystemSetting.destroy({ where: { key: GLOBAL_LOGO_KEY } });
      removeGlobalLogoFile(oldLogoSetting?.value);
    }

    const settingsMap = await buildSettingsMap();

    res.status(200).json({
      success: true,
      message: "Global settings updated successfully",
      data: settingsMap,
    });
  } catch (error) {
    next(error);
  }
};
