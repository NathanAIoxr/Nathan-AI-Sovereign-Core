// NATHAN TABOR 3-D PRINT SHOP — FIVE TO ONE PHYSICAL DEMONSTRATOR
// Original parametric design, independently created for this project.
// Units: millimeters. Use OpenSCAD to export individual STLs.
// SIMULATOR / EDUCATIONAL DEMONSTRATOR — not a NASA printer replica.
// No powered hardware is controlled by this source file.
// Panels assemble through side dovetail connectors from the Z direction.
// Test clearance on real equipment before use.
panel_index = 0; // 0=BODY, 1=SOUL, 2=SHADOW, 3=MIND, 4=SPIRIT
panel_w = 50;
panel_h = 60;
panel_thickness = 5;
connector_reach = 8;
clearance = 0.35;
labels = ["BODY","SOUL","SHADOW","MIND","SPIRIT"];
function right_edge(has_tab) = has_tab ? [
 [panel_w, 0], [panel_w, 20],
 [panel_w+connector_reach, 18], [panel_w+connector_reach, 42],
 [panel_w, 40], [panel_w, panel_h]
] : [[panel_w,0],[panel_w,panel_h]];
function left_edge(has_slot) = has_slot ? [
 [0, panel_h], [0, 40+clearance],
 [connector_reach+clearance, 42+clearance],
 [connector_reach+clearance, 18-clearance],
 [0, 20-clearance], [0, 0]
] : [[0,panel_h],[0,0]];
function outline(i) = concat([[0,0]], right_edge(i<4), left_edge(i>0));
module panel(i) {
 assert(i>=0 && i<5, "panel_index must be 0-4");
 union() {
  linear_extrude(height=panel_thickness) polygon(points=outline(i));
  translate([panel_w/2, panel_h/2, panel_thickness])
   linear_extrude(height=0.7)
    text(labels[i], size=6.3, halign="center", valign="center", font="Liberation Sans:style=Bold");
  translate([panel_w/2, 14, panel_thickness])
   linear_extrude(height=0.6)
    text(str(i+1), size=7.0, halign="center", valign="center",font="Liberation Sans:style=Bold");
 }
}
panel(panel_index);
