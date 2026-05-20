print("Analyzing EAM file structure...")
with open(
    "F:/opencode/claude-code-main/claude-code-main/knowledge/cases/paper-reproduction/paper1_zope-mishin-2003/Zope-Ti-Al-2003.eam.alloy",
    "r",
) as f:
    lines = f.readlines()

Nrho = 10000
Nr = 10000

# Parse header
print("Line 0:", lines[0].strip())
print("Line 1:", lines[1].strip())
print("Line 2:", lines[2].strip())
print("Line 3:", lines[3].strip())
print("Line 4:", lines[4].strip())
print("Line 5:", lines[5].strip())

# Element metadata lines: should be 2 lines after line 4
# Let's scan for lines that look like element metadata
# (atomic number, mass, lattice constant, lattice type)
for i in range(6, 100):
    parts = lines[i].split()
    if len(parts) >= 4:
        try:
            n = float(parts[0])
            m = float(parts[1])
            lc = float(parts[2])
            lt = parts[3] if len(parts) > 3 else ""
            if 0 < n < 40 and 0 < m < 300 and 0 < lc < 10:
                print(f"Element metadata at line {i}: n={n}, m={m}, lc={lc}, lt={lt}")
        except:
            pass

print()
# Check Ti embedding values
ti_embed_start = 6 + Nrho
ti_embed_end = ti_embed_start + Nrho
print(f"Ti embedding at line {ti_embed_start}: {lines[ti_embed_start].strip()}")
print(f"Ti embedding at line {ti_embed_start + 1}: {lines[ti_embed_start + 1].strip()}")
print(f"Ti embedding at line {ti_embed_start + 2}: {lines[ti_embed_start + 2].strip()}")
print(f"Ti embedding last: {lines[ti_embed_end - 1].strip()}")

# Check if Al density starts somewhere
for i in range(20000, 30010, 100):
    if i < len(lines):
        print(f"Line {i}: {lines[i].strip()}")
