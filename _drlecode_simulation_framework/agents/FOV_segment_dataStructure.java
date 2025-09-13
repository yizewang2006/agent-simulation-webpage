package agents;

import java.util.ArrayList;

import entities.Entity;

public class FOV_segment_dataStructure 
{
	public ArrayList<FOV_segment> FOV_segment_list = new ArrayList<FOV_segment>();
	public double radius = 0;
	
	public FOV_segment_dataStructure(ArrayList<FOV_segment> FOV_segment_l, double r)
	{
		//Deep copy here
		for (FOV_segment fov : FOV_segment_l)
		{
			FOV_segment a_segment = new FOV_segment(fov.range_start, fov.range_end);
			
			a_segment.empty = fov.empty;
			a_segment.remove = fov.remove;
			a_segment.heading_angle = fov.heading_angle;
			
			
			for (Entity e : fov.FOV_segment_entity)
			{
				a_segment.FOV_segment_entity.add(e);
			}
			
			FOV_segment_list.add(a_segment);
		}
		this.radius = r;
	}
	
	
}
