package SpaceHeadingEntity;

import entities.Entity;

//This entity is special because it is generated dynamically based on how empty and occupied space are distributed at each time step.
public class SpaceHeadingEntity extends Entity
{
	//The heading option
	public int heading = 0;
	//How far agent can travel with this distance
	public double distance_travel = 0;
	public double distance_travel_to_entity;
	public double distance_travel_to_agent;
	public double distance_travel_to_cir_obs;
	public double distance_travel_to_rec_obs;
	public double distance_travel_to_all_obs;
	public double distance_travel_to_goal_points;
	
	//How different between this option and the current interesting heading
	//This current interesting heading can be: desired direction (to escape) or the current direction of agent
	public int distance_angle_to_desire_direction = 0;
	public double distance_travel_to_desire_goal = 0;
	
	
	//Each heading as a travel distance
	//This predict travel distance is used to check if agent end up at its destination
	//How near it is to the nearest desired goal
	public double predict_distance_travel_to_nearest_desire_goal = 0;
	public int distance_angle_to_current_direction = 0;
	public int entity_density = 0;
	public boolean remove = false;
	public double score = 0;
	public boolean within_general_direction_range = false;

	
	public SpaceHeadingEntity(double d, int h, int dd, int dc, int den, double travel_dis_to_desire, double predict_dis_to_desire)
	{
		super(6);
		distance_travel = d;
		predict_distance_travel_to_nearest_desire_goal = predict_dis_to_desire;
		heading = h;
		distance_angle_to_desire_direction = dd;
		distance_travel_to_desire_goal = travel_dis_to_desire;
		distance_angle_to_current_direction = dc;
		entity_density = den;
		
	}

	public SpaceHeadingEntity(int h, int angle_d_to_desired, int angle_d_to_current, double d_travel, double d_to_entity, double d_to_agent, double d_to_circle_obs, double d_to_rectangle_obs, double d_to_all_obs, double d_to_goal_point) 
	{
		super(6);
		heading = h;
		distance_angle_to_desire_direction = angle_d_to_desired;
		distance_angle_to_current_direction = angle_d_to_current;
		distance_travel = d_travel;
		distance_travel_to_entity = d_to_entity;
		distance_travel_to_agent = d_to_agent;
		distance_travel_to_cir_obs = d_to_circle_obs;
		distance_travel_to_rec_obs = d_to_rectangle_obs;
		distance_travel_to_all_obs = d_to_all_obs;
		distance_travel_to_goal_points = d_to_goal_point;
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

	public double getReferenceValue()
	{
		
		return 0;
	}
}
