import os

index_path = r'C:\project Straxon\straxonsecure\src\routes\index.tsx'
globes_path = r'C:\project Straxon\straxonsecure\src\components\cyber\LandingGlobes.tsx'

with open(index_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The functions start at line 42 and end at line 308
# 42 is: // ─────────────────────────────────────────────
# 308 is: // ───────────────────────────────────────────────────────────────────────────── (PAGE COMPONENT)

start_line = 41  # index 41 is line 42
end_line = 308   # index 308 is line 309

extracted_lines = lines[start_line:end_line]

imports = """import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

"""

globes_content = "".join(extracted_lines)
globes_content = globes_content.replace('function ParticleSwarm', 'export function ParticleSwarm')
globes_content = globes_content.replace('function BackgroundGlobe', 'export function BackgroundGlobe')
globes_content = globes_content.replace('function CyberEarth', 'export function CyberEarth')

with open(globes_path, 'w', encoding='utf-8') as f:
    f.write(imports + globes_content)
    
print("Created LandingGlobes.tsx")

replacement = """import React, { lazy, Suspense } from "react";

const ParticleSwarm = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.ParticleSwarm })));
const BackgroundGlobe = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.BackgroundGlobe })));
const CyberEarth = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.CyberEarth })));

"""

new_lines = lines[:start_line] + [replacement] + lines[end_line:]

with open(index_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
    
print("Updated index.tsx")
