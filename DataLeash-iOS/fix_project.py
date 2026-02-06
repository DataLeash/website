
import os

project_path = '/Users/hadi/Desktop/dataleash-1/DataLeash-iOS/DataLeash.xcodeproj/project.pbxproj'

with open(project_path, 'r') as f:
    lines = f.readlines()

new_lines = []
files_inserted = False

# Entries to insert
build_file_entries = [
    '		111111111111111111111164 /* FilesView.swift in Sources */ = {isa = PBXBuildFile; fileRef = 111111111111111111111165 /* FilesView.swift */; };\n',
    '		111111111111111111111166 /* InboxView.swift in Sources */ = {isa = PBXBuildFile; fileRef = 111111111111111111111167 /* InboxView.swift */; };\n'
]

file_ref_entries = [
    '		111111111111111111111165 /* FilesView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = FilesView.swift; sourceTree = "<group>"; };\n',
    '		111111111111111111111167 /* InboxView.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = InboxView.swift; sourceTree = "<group>"; };\n'
]

group_entries = [
    '				111111111111111111111165 /* FilesView.swift */,\n',
    '				111111111111111111111167 /* InboxView.swift */,\n'
]

sources_entries = [
    '				111111111111111111111164 /* FilesView.swift in Sources */,\n',
    '				111111111111111111111166 /* InboxView.swift in Sources */,\n'
]

# Process lines
for line in lines:
    new_lines.append(line)
    
    # Insert BuildFile entries (check for ProfileView in Sources)
    if '/* ProfileView.swift in Sources */' in line and 'isa = PBXBuildFile' in line:
        if not any('FilesView.swift in Sources' in l for l in lines): # Avoid dupes
            new_lines.extend(build_file_entries)

    # Insert FileRef entries
    if '/* ProfileView.swift */' in line and 'isa = PBXFileReference' in line:
        if not any('FilesView.swift */ = {isa' in l for l in lines):
            new_lines.extend(file_ref_entries)
            
    # Insert into Group (children)
    # This is tricky, we look for ProfileView inside a children list
    if '/* ProfileView.swift */,' in line:
        # Verify we are in a children list (usually indented tabs)
        if not any('/* FilesView.swift */,' in l for l in lines):
             new_lines.extend(group_entries)

    # Insert into Sources Build Phase
    # Also looks like "ProfileView.swift in Sources" but with a comma
    if '/* ProfileView.swift in Sources */,' in line:
        if not any('/* FilesView.swift in Sources */,' in l for l in lines):
            new_lines.extend(sources_entries)

with open(project_path, 'w') as f:
    f.writelines(new_lines)

print("Project file patched successfully.")
