import re
import os

index_path = r'C:\project Straxon\straxonsecure\src\routes\index.tsx'
globes_path = r'C:\project Straxon\straxonsecure\src\components\cyber\LandingGlobes.tsx'

with open(index_path, 'r', encoding='utf-8') as f:
    content = f.read()

# The functions to extract: ParticleSwarm, BackgroundGlobe, CyberEarth
# They start from:
# // ─────────────────────────────────────────────
# // 1. 3D HOLOGRAPHIC BACKGROUND (Particle Swarm)
# and end right before:
# // ─────────────────────────────────────────────────────────────────────────────
# // PAGE COMPONENT
# // ─────────────────────────────────────────────────────────────────────────────

start_marker = "// ─────────────────────────────────────────────\n// 1. 3D HOLOGRAPHIC BACKGROUND (Particle Swarm)"
end_marker = "// ─────────────────────────────────────────────────────────────────────────────\n// PAGE COMPONENT"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx != -1 and end_idx != -1:
    globes_content = content[start_idx:end_idx]
    
    # Prepend required imports to LandingGlobes.tsx
    imports = """import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { supabase } from "@/integrations/supabase/client";

"""
    
    # We must add 'export' to the three functions so they can be imported lazily
    globes_content = globes_content.replace('function ParticleSwarm', 'export function ParticleSwarm')
    globes_content = globes_content.replace('function BackgroundGlobe', 'export function BackgroundGlobe')
    globes_content = globes_content.replace('function CyberEarth', 'export function CyberEarth')

    with open(globes_path, 'w', encoding='utf-8') as f:
        f.write(imports + globes_content)
        
    print("Created LandingGlobes.tsx")
    
    # Now replace the extracted content in index.tsx with lazy imports
    replacement = """import React, { lazy, Suspense } from "react";

const ParticleSwarm = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.ParticleSwarm })));
const BackgroundGlobe = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.BackgroundGlobe })));
const CyberEarth = lazy(() => import("@/components/cyber/LandingGlobes").then(m => ({ default: m.CyberEarth })));

"""
    
    new_index_content = content[:start_idx] + replacement + content[end_idx:]
    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(new_index_content)
        
    print("Updated index.tsx")
else:
    print("Could not find markers")
