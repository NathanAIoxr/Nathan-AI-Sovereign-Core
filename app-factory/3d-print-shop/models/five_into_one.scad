// Nathan Tabor five nonfunctional educational connection tiles.
// All measurements nominal millimeters. Test joint tolerance on actual material.
// Print individually: openscad -o matrix_1.stl -D 'TILE=0' five_into_one.scad
// TILE index: 0=BODY 1=SOUL 2=SHADOW 3=MIND 4=SPIRIT
TILE=0;
tile_w=70;
tile_h=45;
tile_z=5;
tongue_depth=10;
tongue_width=15;
tongue_z=3;
clearance=0.35;
labels=["BODY","SOUL","SHADOW","MIND","SPIRIT"];
assert(TILE>=0 && TILE<=4);

module base_part(i){
  difference(){
    union(){
      cube([tile_w,tile_h,tile_z],center=false);
      if(i<4)
        translate([tile_w,15,tile_z/2-tongue_z/2])
          cube([tongue_depth,tongue_width,tongue_z]);
    }
    if(i>0)
      translate([-0.05,15-clearance/2,tile_z/2-tongue_z/2-clearance/2])
        cube([tongue_depth+clearance,tongue_width+clearance,tongue_z+clearance]);
  }
}
module one_tile(i){
  union(){
    base_part(i);
    translate([12,20,tile_z])
      linear_extrude(height=0.7)
      text(labels[i],size=7,halign="left",valign="center");
    if(i==2)
      translate([24,8,tile_z])
        linear_extrude(height=0.7)
        text("ONE",size=5.5);
  }
}
one_tile(TILE);
