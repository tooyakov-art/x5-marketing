import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const infoPlistPath = resolve('ios/App/App/Info.plist');
const pbxProjPath = resolve('ios/App/App.xcodeproj/project.pbxproj');

console.log('--- MIGRATING BUNDLE ID TO com.x5pro.app ---');

// 1. Update Info.plist
if (existsSync(infoPlistPath)) {
  try {
    let content = readFileSync(infoPlistPath, 'utf-8');
    
    // Replace Bundle ID
    if (content.includes('com.x5marketing.app')) {
        content = content.replace(/com\.x5marketing\.app/g, 'com.x5pro.app');
        console.log('✓ Info.plist: Bundle ID updated');
    }

    // Reset Version to 1.0 (Replacing old 3.0 values)
    content = content.replace(/<string>3<\/string>/g, '<string>1</string>');
    content = content.replace(/<string>3\.0<\/string>/g, '<string>1.0</string>');
    
    // Ensure version is set to 1/1.0 via generic regex if strictly 3/3.0 wasn't found
    const versionRegex = /(<key>CFBundleVersion<\/key>\s*<string>)([^<]*)(<\/string>)/;
    if (versionRegex.test(content)) {
        content = content.replace(versionRegex, '$11$3');
    }
    const shortVersionRegex = /(<key>CFBundleShortVersionString<\/key>\s*<string>)([^<]*)(<\/string>)/;
    if (shortVersionRegex.test(content)) {
        content = content.replace(shortVersionRegex, '$11.0$3');
    }

    writeFileSync(infoPlistPath, content);
    console.log('✓ Info.plist: Version reset to 1.0');
  } catch (e) {
    console.error('Error updating Info.plist', e);
  }
} else {
    console.warn('⚠️ Info.plist not found at ' + infoPlistPath);
}

// 2. Update project.pbxproj
if (existsSync(pbxProjPath)) {
  try {
    let content = readFileSync(pbxProjPath, 'utf-8');
    
    if (content.includes('com.x5marketing.app')) {
        content = content.replace(/com\.x5marketing\.app/g, 'com.x5pro.app');
        writeFileSync(pbxProjPath, content);
        console.log('✓ project.pbxproj: Bundle ID updated to com.x5pro.app');
    } else {
        console.log('project.pbxproj: No old Bundle ID found (or already updated)');
    }
  } catch (e) {
    console.error('Error updating project.pbxproj', e);
  }
} else {
    console.warn('⚠️ project.pbxproj not found at ' + pbxProjPath);
}

console.log('ID CHANGED TO com.x5pro.app');