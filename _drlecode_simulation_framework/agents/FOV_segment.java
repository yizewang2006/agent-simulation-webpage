package agents;

import java.util.ArrayList;

import core.Main;
import entities.Entity;

public class FOV_segment 
{
	public int range_start;
	public int range_end;
	public int heading_angle;
	
	public boolean remove = false;
	public boolean empty = true;
	
	public ArrayList<Entity> FOV_segment_entity = new ArrayList<Entity>();
	
	public FOV_segment(int s, int e)
	{
		this.range_start = s;
		this.range_end = e;
		
		this.heading_angle = (s+e)/2;
	}
	
	public void add_entity_list(ArrayList<Entity> add_list)
	{
		for (Entity e : add_list)
		{
			FOV_segment_entity.add(e);
		}
	}
	
	public void add_one_entity(Entity add_entity)
	{
		FOV_segment_entity.add(add_entity);
	}
	
	
	public int getdistanceAngle(double heading, int reference_angle)
	{
		
		int distance_angle = 0;
		
		//Need to include the middle heading reference as well.
		if (heading * reference_angle < 0)
		{
			distance_angle = (int) (Math.abs(reference_angle) + Math.abs(heading));
		}
		else if (heading * reference_angle > 0)
		{
			distance_angle = (int) Math.abs(Math.abs(reference_angle) - Math.abs(heading));
		}
		else
		{
			if (heading == 0)
			{
				if (reference_angle > 0)
				{
					if (reference_angle > 180)
					{
						distance_angle = (int) Math.abs(360 - reference_angle);
					}
					else
					{
						distance_angle = reference_angle;
					}
				}
				else if (reference_angle < 0)
				{
					if (reference_angle < -180)
					{
						distance_angle = (int) Math.abs(360 - Math.abs(reference_angle));
					}
					else
					{
						distance_angle = Math.abs(reference_angle);
					}
				}
				else
				{
					distance_angle = 0;
				}
			}
			
			if (reference_angle == 0)
			{
				//heading angle will not be negative
				if (heading == 0)
				{
					distance_angle = 0;
				}
				else if (heading < 180)
				{
					distance_angle = (int) heading; 
				}
				else
				{
					distance_angle = (int) (360 - heading);
				}
			}
		}
		
		
		while (distance_angle > 180)
		{
			distance_angle = Math.abs(360 - distance_angle);
		}
		
			
		return distance_angle;
	}
	
	//give a filed of view segment
	//return all possible heading directions within the segment width
	public ArrayList<Integer> headingDirectionOptions(FOV_segment fov)
	{
		ArrayList<Integer> headingOption = new ArrayList<Integer>();
		
		int middle_reference = 0;
		//Make one heading reference at each 20 degree.
		int segment_interval = 10;
		
		//Where segment is in both 1st and 4th quadrant
		if (fov.range_start > fov.range_end)
		{
			//Convert to negative
			fov.range_start = fov.range_start - 360;
			
			middle_reference = (fov.range_end + fov.range_start)/2;
		}
		else
		{
			//The middle heading reference is always include
			middle_reference = (fov.range_end + fov.range_start )/2;
		}
		
		headingOption.add(middle_reference);
		
		int reference_to_fov_end = middle_reference;
		int reference_to_fov_start = middle_reference;
		
		boolean include_fov_start = false;
		boolean include_fov_end = false;
		
		//Take care reference heading from middle to fov_start
		while (reference_to_fov_start- segment_interval >= fov.range_start)
		{
			reference_to_fov_start = reference_to_fov_start - segment_interval;
			
			//To make sure to most start option is include
			if (Math.abs(reference_to_fov_start - fov.range_start) <= segment_interval)
			{
				include_fov_start = true;
				headingOption.add(fov.range_start+2);
				break;
			}	
			else
			{
				headingOption.add(reference_to_fov_start);
			}
			
			
		}
		
		while (reference_to_fov_end + segment_interval <= fov.range_end)
		{
			reference_to_fov_end = reference_to_fov_end + segment_interval;
			
			//To make sure to most end option is include
			if (Math.abs(reference_to_fov_end - fov.range_end) <= segment_interval)
			{
				include_fov_end = true;
				headingOption.add(fov.range_end-2);
				break;
			}	
			else
			{
				headingOption.add(reference_to_fov_end);
			}

			
		}
		
		if (include_fov_start == false)
		{
			headingOption.add(fov.range_start);
		}
		
		if (include_fov_end == false)
		{
			headingOption.add(fov.range_end);
		}
		
		
		return headingOption;
	}
}
