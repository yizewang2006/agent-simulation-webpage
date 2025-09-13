package Action;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;
import java.util.Stack;

import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import SpaceHeadingEntity.SpaceHeadingEntity;
import Utility.ReturnSenseObstacle;
import agents.Agent;
import agents.FOV_segment;
import agents.FOV_segment_dataStructure;
import agents.FieldOfView;
import agents.Position;
import Utility.PositionAngle_DataStructure;
import behavior.Behavior;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import zones.Zone;
import zones.Zone_rectangle;
import zones.Zone_triangle;

public class SpaceReference_Static extends Action
{
	//act_on_empty_space
	// 0 -> not act on
	// 1 -> act on
	public int act_on_empty_space = 1;

	// 1 -> nearest_desired
	// 2 -> travel distance to entity
	// 2.1 -> travel distance to agent
	// 2.2 -> travel distance to circle obstacles
	// 2.3 -> travel distance to rec obs
	// 2.4 -> travel distance to obstacles
	// 2.5 -> travel distance to the leader
	// 3 -> nearest_turning

	public double act_on_space_property = 0;

	// 1 -> nearest
	// 2 -> farthest
	public int heading_option_combination = 0;

	//Filter chain for space is
	//Filter_p == 1 -> angle distance to desired direction
	//filter_p == 2 -> travel farthest
	//filter_p == 3 -> angle distance to current direction
	public ArrayList<Filter> filter_chain = new ArrayList<Filter>();

	//This parameter is used to know desired direction
	//This parameter = true if agent is within a range from entrance hallway.
	boolean within_entrance_sense = true;

	public SpaceReference_Static()
	{

	}

	//Set a random space bahvior
	//extract_property for space behavior is always angle - at least for now
	public SpaceReference_Static(double extract_p)
	{
		super(2,extract_p,0);

		Random rand = new Random();

		// 0 -> not act on
		// 1 -> act on
		this.act_on_empty_space = rand.nextInt(2);

		//For now, this behavior only for empty space
		this.act_on_empty_space = 1;

		// 1 -> nearest_desired
		// 2 -> farthest 
		// 3 -> nearest_turning
		this.act_on_space_property = Main.searchSpace.act_on_space_property.get(rand.nextInt(Main.searchSpace.act_on_space_property.size()));


		// 1 -> nearest for angle distance - farthest for travel distance
		// 2 -> farthest for angle distance - nearest for travel distance
		this.heading_option_combination = rand.nextInt(2) + 1;

		this.heading_option_combination = 1;

		//Add a random filter here
		Filter f = new Filter();

		//There are 3 types of filter for space
		this.filter_chain = f.setRandomFilterChain(new SpaceReference_Static());

	}


	//Preset a space behavior
	public SpaceReference_Static(double offset, ArrayList<Filter> filter_c, int act_on_empty_s, double FOV_zone_com_f, int FOV_distance_o, double extract_p)
	{
		super(2, extract_p, offset);
		this.act_on_empty_space = act_on_empty_s;
		this.act_on_space_property = FOV_zone_com_f;
		this.heading_option_combination = FOV_distance_o;
		this.filter_chain = filter_c;
	}


	public double getReferenceValue(ArrayList<Entity> neighbor_entities, ArrayList<Obstacle> obstacles, ArrayList<Goal> goals, Agent target_agent, boolean for_action)
	{
		ArrayList<SpaceHeadingEntity> heading_option = new ArrayList<SpaceHeadingEntity>();

		//This heading option contains all distance to all entities, and specific type of entity such as: agent, circle obs, and rectangle obs
		heading_option = generateHeadingOptionProperty(neighbor_entities, obstacles, target_agent);

		double min_distance = Double.MAX_VALUE;
		
		int desired_lower_bound = 0;
		int desired_upper_bound = 0;

		//Get the desired direction range
		for (Goal g : Main.goals)
		{
			if (g instanceof Goal_point)
			{
				Goal_point g_p = (Goal_point) g;
				
				if (Main.global_var.worldWarp == true)
				{
					//Find no_warp_distance first
					double distance_no_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, g_p.position);
					
					//Find warp_distance
					Position goal_point_warp = g_p.position.getWarpPosition(target_agent.position, g_p.position);
					
					if (goal_point_warp.x == 0 && goal_point_warp.y == 0)
					{
						if (distance_no_warp < min_distance)
						//meaning both target_agent and the goal_point are in the same quarter (TOP-L. TOP-R, BOTTOM-L, BOTTOM-R)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, g_p.position);
							desired_upper_bound = desired_lower_bound;
							min_distance = distance_no_warp;
						}
					}
					else
					{
						double distance_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, goal_point_warp);
						
						if (distance_no_warp < min_distance && distance_no_warp <= distance_warp)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, g_p.position);
							desired_upper_bound = desired_lower_bound;
							min_distance = distance_no_warp;
						}
						
						else if (distance_warp < min_distance && distance_warp <= distance_no_warp)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, goal_point_warp);
							desired_upper_bound = desired_lower_bound;
							min_distance = distance_warp;
						}
						
						/*
						//Head to direction with smaller distance
						if (distance_no_warp <= distance_warp)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, g_p.position);
							desired_upper_bound = desired_lower_bound;
						}
						else
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, goal_point_warp);
							desired_upper_bound = desired_lower_bound;
						}
						*/
						
					}
					
				}
			}
				
			//we only care desire direction to entrance, not door
			else if (g instanceof Goal_rectangle && g.type.value == 3.1)
			{
				
				double limit_FOV_to_see_goal = 1000;

				Goal_rectangle hallway_zone = (Goal_rectangle) g;
				
				if (target_agent.getCurrentZone(hallway_zone) != 0)
				{
					desired_lower_bound = 0;
					desired_upper_bound = 0;
				}
				else
				{
					ArrayList<positionDistance> dis_list = new ArrayList<positionDistance>();

					//SortbyDistancetoEntrance

					double dis_to_pos1 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos1.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos1.y, 2));
					dis_list.add(new positionDistance(hallway_zone.zone_goal.pos1, dis_to_pos1,1));
					double dis_to_pos2 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos2.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos2.y, 2));
					dis_list.add(new positionDistance(hallway_zone.zone_goal.pos2, dis_to_pos2,2));
					double dis_to_pos3 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos3.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos3.y, 2));
					dis_list.add(new positionDistance(hallway_zone.zone_goal.pos3, dis_to_pos3,3));
					double dis_to_pos4 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos4.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos4.y, 2));
					dis_list.add(new positionDistance(hallway_zone.zone_goal.pos4, dis_to_pos4,4));

					Collections.sort(dis_list, new SortbyDistancetoEntrance());

					//Entrance now is always on the right, so we only care for pos1 and pos4
					//If only one position is within  limit_FOV_to_see_goal -> desired direction is one value only
					if (dis_list.get(0).distance < limit_FOV_to_see_goal && dis_list.get(1).distance  > limit_FOV_to_see_goal)
					{

						desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, dis_list.get(0).position);
						desired_lower_bound = desired_upper_bound;


					}
					else if (dis_list.get(0).distance > limit_FOV_to_see_goal && dis_list.get(1).distance  < limit_FOV_to_see_goal)
					{
						desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, dis_list.get(1).position);
						desired_upper_bound = desired_lower_bound;


					}
					//This is where both pos1 and pos4 are within limit_FOV_to_see_goal.
					//Desire direction now is a range.
					else if (dis_list.get(0).distance < limit_FOV_to_see_goal && dis_list.get(1).distance < limit_FOV_to_see_goal)
					{

						if ( (dis_list.get(0).corner_num == 1 && dis_list.get(1).corner_num == 4) || (dis_list.get(0).corner_num == 4 && dis_list.get(1).corner_num == 1))
						{

							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos4);
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos1);

						}

						else if ((dis_list.get(0).corner_num == 2 && dis_list.get(1).corner_num == 3) || (dis_list.get(0).corner_num == 3 && dis_list.get(1).corner_num == 2))
						{
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos3);
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos2);


						}

					}
					else
					{
						within_entrance_sense = false;
						//System.out.println("Not sense the entrance");
					}
				}
				
			}
		}

		//Use zone to test more challenging scenario
		
		if (Main.zones.isEmpty() == false)
		{
			for (Zone z : Main.zones)
			{
				if (z instanceof Zone_rectangle)
				{
					Zone_rectangle z_rec = (Zone_rectangle) z;
					
					//Check if traget_agent position is inside this triangle zone or not
					if (z_rec.inside(target_agent.position))
					{
						int heading_start = 0;
						int heading_end = 0;
						int heading_to = 0;
						
						if (z_rec.ID == 1)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(150,163));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(150,67));

						}
						else if (z_rec.ID == 1.1)
						{
							
							
						}
						else if (z_rec.ID == 2)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(300,125));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(300,105));
							
						}
						else if (z_rec.ID == 2.1)
						{
							
						}
						else if (z_rec.ID == 3)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,125));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,105));

						}
						else if (z_rec.ID == 4)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(500,163));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(500,67));

						}
						else if (z_rec.ID == 5)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(590,163));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(590,67));
						}
						//System.out.println("Inside the triangle");
						
						heading_to = z_rec.pre_set_heading;
					}
				}
				else if (z instanceof Zone_triangle)
				{
					Zone_triangle z_tri = (Zone_triangle) z;
					
					//Check if traget_agent position is inside this triangle zone or not
					if (z_tri.inside(target_agent.position))
					{
						int heading_start = 0;
						int heading_end = 0;
						
						if (z_tri.ID == 4)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(365,100));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(395,100));
						}
						else if (z_tri.ID == 5)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(365,100));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(395,100));
						}
						else if (z_tri.ID == 6)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,225));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,195));
						}
						else if (z_tri.ID == 7)
						{
							desired_lower_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,225));
							desired_upper_bound = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,195));
						}
						
						//System.out.println("Inside the triangle");
						//heading_to = z_tri.pre_set_heading;
						//desireDirectionSingleList.add(new desireDirection (heading_start,heading_end, 0));
						
						//desireDirectionSingleList.add(new desireDirection (z_tri.pre_set_heading,z_tri.pre_set_heading, 0));
						//desireDirectionRangeList.add(new desireDirection(heading_start, heading_end,0));
					}
				}
			}
			
			
		}

		Random rand = new Random();

		if(extract_property == 1 || extract_property == 2.0 || extract_property == 2.1 || extract_property == 3.0)
		{

			for (SpaceHeadingEntity se : heading_option)
			{
				//Not regular, lower range in lower half and upper range in upper half
				if (desired_lower_bound > desired_upper_bound)
				{
					//Find angle distance to desired direction
					if (se.heading > desired_lower_bound && se.heading <= 359 || se.heading >= 0 && se.heading < desired_upper_bound)
					{
						se.distance_angle_to_desire_direction = 0;
					}
					else
					{
						int distance_angle_to_lower_bound = se.getdistanceAngle(se.heading, desired_lower_bound);
						int distance_angle_to_upper_bound = se.getdistanceAngle(se.heading, desired_upper_bound);

						if (distance_angle_to_lower_bound < distance_angle_to_upper_bound)
						{
							se.distance_angle_to_desire_direction = distance_angle_to_lower_bound;
						}
						else
						{
							se.distance_angle_to_desire_direction = distance_angle_to_upper_bound;
						}
					}
				}
				else
				{
					if (se.heading >= desired_lower_bound && se.heading <= desired_upper_bound)
					{
						se.distance_angle_to_desire_direction = 0;
					}
					else
					{
						int distance_angle_to_lower_bound = se.getdistanceAngle(se.heading, desired_lower_bound);
						int distance_angle_to_upper_bound = se.getdistanceAngle(se.heading, desired_upper_bound);

						if (distance_angle_to_lower_bound < distance_angle_to_upper_bound)
						{
							se.distance_angle_to_desire_direction = distance_angle_to_lower_bound;
						}
						else
						{
							se.distance_angle_to_desire_direction = distance_angle_to_upper_bound;
						}
					}
				}

				//Find angle distance to current direction
				se.distance_angle_to_current_direction = se.getdistanceAngle(se.heading, target_agent.heading.value);
			}


		}

		/*
		for (SpaceHeadingEntity se : heading_option)
		{
			System.out.println("Heading option " + se.heading);
			System.out.println("Distance to desired " + se.distance_travel_to_cir_obs);
			//System.out.println("Dsitance to current " + se.distance_angle_to_current_direction);
		}
		 */

		heading_option.removeIf(n -> n.distance_travel == 0);
		
		//Filter out unwanted space heading entity
		for (Filter f: filter_chain)
		{
			if (f instanceof Filter_ranged)
			{
				Filter_ranged f_r = (Filter_ranged)f ;
				//Filter desired direction
				if (f.filtered_p == 1)
				{
					heading_option.removeIf(n -> n.distance_angle_to_desire_direction < f_r.lowerRange || n.distance_angle_to_desire_direction > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2)
				{
					heading_option.removeIf(n -> n.distance_travel < f_r.lowerRange || n.distance_travel > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2.1)
				{
					heading_option.removeIf(n -> n.distance_travel_to_agent < f_r.lowerRange || n.distance_travel_to_agent > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2.2)
				{
					heading_option.removeIf(n -> n.distance_travel_to_cir_obs < f_r.lowerRange || n.distance_travel_to_cir_obs > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2.3)
				{
					heading_option.removeIf(n -> n.distance_travel_to_rec_obs < f_r.lowerRange || n.distance_travel_to_rec_obs > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2.4)
				{
					heading_option.removeIf(n -> n.distance_travel_to_all_obs < f_r.lowerRange || n.distance_travel_to_all_obs > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2.5)
				{
					heading_option.removeIf(n -> n.distance_travel_to_goal_points < f_r.lowerRange || n.distance_travel_to_goal_points > f_r.upperRange);
				}
				//Filter current distance
				else if (f.filtered_p == 3)
				{
					heading_option.removeIf(n -> n.distance_angle_to_current_direction < f_r.lowerRange || n.distance_angle_to_current_direction > f_r.upperRange);
				}
			}
		}

		if (heading_option.size() == 0)
		{
			if (for_action == false)
			{
				return Double.NaN;
			}
			else
			{
				return -target_agent.heading.value;
			}

		}

		// 1 -> nearest_desired
		// 2 -> travel distance to entity
		// 2.1 -> travel distance to agent
		// 2.2 -> travel distance to circle obstacles
		// 2.3 -> travel distance to rec obs
		//2.4 -> travel distance to all obs
		// 3 -> nearest_turning

		//angle distance to desired direction property
		if (act_on_space_property == 1)
		{
			//choose the nearest
			if (heading_option_combination == 1)
			{
				//Need to take care if there are more than one heading option with distance to desired angle = 0
				ArrayList<SpaceHeadingEntity> decision_option_for_desired_heading_equal0 = new ArrayList<SpaceHeadingEntity>();
				
				//heading_option.removeIf(n -> n.distance_travel_to_entity == 0);
				

				if (heading_option.size() == 0)
				{
					if (for_action == false)
					{
						return Double.NaN;
					}
					else
					{
						return target_agent.heading.value;
					}

				}
				
				for (SpaceHeadingEntity se : heading_option)
				{
					//System.out.println("heading option: " + se.heading);
					
					if (se.distance_angle_to_desire_direction == 0)
					{
						decision_option_for_desired_heading_equal0.add(se);
					}
				}

				//System.out.println("desired_lower_bound" + desired_lower_bound);
				//System.out.println("desired_upper_bound" + desired_upper_bound);
				//If there is at least one heading option with angle distance to desired direction = 0
				if (decision_option_for_desired_heading_equal0.size() > 0)
				{
					//-> Sort by nearest to current direction
					Collections.sort(decision_option_for_desired_heading_equal0, new SortbyDistance_Angle_to_Current_Direction());
					
					//System.out.println("Current heading: " + target_agent.heading.value);
					
					/*
					for (SpaceHeadingEntity se : decision_option_for_desired_heading_equal0)
					{
						System.out.println("heading option within desire: " + se.heading);
					}
					*/
					
					if (for_action == false)
					{
						return decision_option_for_desired_heading_equal0.get(0).distance_angle_to_desire_direction;
					}
					else
					{
						//SHould it still need to be random between top 2?
						return decision_option_for_desired_heading_equal0.get(0).heading;
					}

				}
				else
				{
					Collections.sort(heading_option, new SortbyDistance_Angle_to_Desired_Direction());

					if (for_action == false)
					{
						return heading_option.get(0).distance_angle_to_desire_direction;
					}
					else
					{
						//if heading option has more than 1 choice
						if (heading_option.size() >= 2)
						{
							int random_index = rand.nextInt(2);

							return heading_option.get(random_index).heading;
						}
						else
						{
							return heading_option.get(0).heading;
						}
					}


				}
			}
			//choose the farthest
			else if (heading_option_combination == 2)
			{
				Collections.sort(heading_option, new SortbyDistance_Angle_to_Desired_Direction());

				if (for_action == false)
				{
					return heading_option.get(heading_option.size() - 1).distance_angle_to_desire_direction;
				}
				else
				{
					if (heading_option.size() >= 2)
					{
						int random_index = heading_option.size() - rand.nextInt(2) - 1;

						return heading_option.get(random_index).heading;
					}
					else
					{
						return heading_option.get(0).heading;
					}
				}

			}
		}
		else if (act_on_space_property == 3)
		{

			//heading_option.removeIf(n -> n.distance_travel_to_entity == 0);
			

			if (heading_option.size() == 0)
			{
				if (for_action == false)
				{
					return Double.NaN;
				}
				else
				{
					return target_agent.heading.value;
				}

			}
			
			//Sort by distance travel from farthest to shortest 
			Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());

			//choose the nearest
			if (heading_option_combination == 1)
			{

				if (for_action == false)
				{
					return heading_option.get(0).distance_angle_to_current_direction;
				}
				else
				{
					//if heading option has more than 1 choice
					if (heading_option.size() >= 2)
					{
						int random_index = rand.nextInt(2);

						return heading_option.get(random_index).heading;
					}
					else
					{
						return heading_option.get(0).heading;
					}
				}				
			}
			//choose the farthest
			else if (heading_option_combination == 2)
			{


				if (for_action == false)
				{
					return heading_option.get(heading_option.size() - 1).distance_angle_to_current_direction;
				}
				else
				{
					if (heading_option.size() >= 2)
					{
						int random_index = heading_option.size() - rand.nextInt(2) - 1;

						return heading_option.get(random_index).heading;
					}
					else
					{
						return heading_option.get(0).heading;
					}
				}

			}
		}
		else
		{	
			//travel distance of entity
			if (act_on_space_property == 2)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortbyDistance_Travel());

			}
			//travel distance of agent
			else if (act_on_space_property == 2.1)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortByDistancetoAgent());

			}
			//travel distance to circle obstacles
			else if (act_on_space_property == 2.2)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortByDistancetoCircleObstacle());

			}
			//travel distance to rectangle obstacle
			else if (act_on_space_property == 2.3)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortByDistancetoRectangleObstacle());

			}
			//travel distance to rectangle obstacle
			else if (act_on_space_property == 2.4)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortByDistancetoAllObstacle());

			}
			//travel distance to goal point
			else if (act_on_space_property == 2.5)
			{
				//Sort by distance travel from farthest to shortest 
				Collections.sort(heading_option, new SortByDistancetoGoalPoint());

			}
			//To return reference for activation -> return the actual distance value
			if (for_action == false)
			{
				int index = 0;

				//get the reference from the farthest
				if (heading_option_combination == 1)
				{
					index = 0;
				}
				//get referecen from the shortest
				else if (heading_option_combination == 2)
				{
					index = heading_option.size() - 1 ;
				}

				//travel distance of entity
				if (act_on_space_property == 2)
				{
					return heading_option.get(index).distance_travel;
				}
				//travel distance of agent
				else if (act_on_space_property == 2.1)
				{
					return heading_option.get(index).distance_travel_to_agent;
				}
				//travel distance to circle obstacles
				else if (act_on_space_property == 2.2)
				{
					return heading_option.get(index).distance_travel_to_cir_obs;
				}
				//travel distance to rectangle obstacles
				else if (act_on_space_property == 2.3)
				{
					return heading_option.get(index).distance_travel_to_rec_obs;
				}
				//travel distance to all obstacles
				else if (act_on_space_property == 2.4)
				{
					return heading_option.get(index).distance_travel_to_all_obs;
				}
				//travel distance to goal point
				else if (act_on_space_property == 2.5)
				{
					return heading_option.get(index).distance_travel_to_goal_points;
				}

			}
			//get reference value for action -> return the heading option value
			else
			{
				//choose the farthest
				if (heading_option_combination == 1)
				{

					//travel distance of entity
					if (act_on_space_property == 2)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortbyDistance_Travel());
						double farthest_distance = heading_option.get(0).distance_travel;
						heading_option.removeIf(n -> n.distance_travel != farthest_distance);
						//In case there is more than 1 heading option with the furthest travel distance 
						//-> choose the one nearest to current direction
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());
					}
					//travel distance of agent
					else if (act_on_space_property == 2.1)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortByDistancetoAgent());
						double farthest_distance = heading_option.get(0).distance_travel_to_agent;
						heading_option.removeIf(n -> n.distance_travel_to_agent != farthest_distance);
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());

					}
					//travel distance to circle obstacles
					else if (act_on_space_property == 2.2)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortByDistancetoCircleObstacle());
						double farthest_distance = heading_option.get(0).distance_travel_to_cir_obs;
						//System.out.println("Furthest travel distance: " + farthest_distance);
						
						heading_option.removeIf(n -> n.distance_travel_to_cir_obs != farthest_distance);
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());
						
						//System.out.println("Current heading: " + target_agent.heading.value);
								
						/*
						for (SpaceHeadingEntity se : heading_option)
						{
							System.out.println("heading option within desire: " + se.heading + " travel distance " + se.distance_travel_to_cir_obs);
						}
						
						System.out.println();
						*/
					}
					//travel distance to rectangle obstacle
					else if (act_on_space_property == 2.3)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortByDistancetoRectangleObstacle());
						double farthest_distance = heading_option.get(0).distance_travel_to_rec_obs;
						
						heading_option.removeIf(n -> n.distance_travel_to_rec_obs != farthest_distance);
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());
						
					}
					//travel distance to all obstacle
					else if (act_on_space_property == 2.4)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortByDistancetoAllObstacle());
						double farthest_distance = heading_option.get(0).distance_travel_to_all_obs;
						heading_option.removeIf(n -> n.distance_travel_to_all_obs != farthest_distance);
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());
					}
					//travel distance to goal point
					else if (act_on_space_property == 2.5)
					{
						//Sort by distance travel from farthest to shortest 
						Collections.sort(heading_option, new SortByDistancetoGoalPoint());
						double farthest_distance = heading_option.get(0).distance_travel_to_goal_points;
						heading_option.removeIf(n -> n.distance_travel_to_goal_points != farthest_distance);
						Collections.sort(heading_option, new SortbyDistance_Angle_to_Current_Direction());
					}

					//if heading option has more than 1 choice
					if (heading_option.size() >= 2)
					{
						int random_index = rand.nextInt(2);

						return heading_option.get(random_index).heading;
					}
					else
					{
						return heading_option.get(0).heading;
					}

				}
				//choose the shortest
				else if (heading_option_combination == 2)
				{
					//if heading option has more than 1 choice
					if (heading_option.size() >= 2)
					{
						int random_index = heading_option.size() - rand.nextInt(2) - 1;

						return heading_option.get(random_index).heading;
					}
					else
					{
						return heading_option.get(0).heading;
					}
				}
			}


		}


		return 0;
	}

	public ArrayList<SpaceHeadingEntity> generateHeadingOptionProperty (ArrayList<Entity> neighbor_entities, ArrayList<Obstacle> obstacles, Agent target_agent)
	{
		//all the heading option after returning should have all distance properties to all entity categories
		ArrayList<SpaceHeadingEntity> heading_option = new ArrayList<SpaceHeadingEntity>();

		

		//This set should contain all the key heading
		//
		ArrayList<Integer> heading_option_value = new ArrayList<Integer>();

		ArrayList<Filter_ranged> filter_category_list = new ArrayList<Filter_ranged>();
		
		//Only keep agent
		filter_category_list.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(1.0)),0));
		//Only keep rectangle obs
		filter_category_list.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(2.0)),0));
		//Only keep circle obs
		filter_category_list.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(2.1)),0));
		//Only keep obstacle in general
		filter_category_list.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(2.0,2.1)),0));
		//Only keep goal point
		filter_category_list.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.1)),0));
		
		
		
		for (Filter_ranged fr: filter_category_list)
		{
			//This list is used to get adaptiveFOV for certain entity types
			ArrayList<Entity> filtered_entity = new ArrayList<Entity>();		
			
			//Obstacle is going hand in hand with filtered_entity list
			ArrayList<Obstacle> filtered_obstacle = new ArrayList<Obstacle>();
			
			if(fr.filtered_set.size() == 1)
			{
				//Want to sense only AGENT entity
				//filtered_entity only has agent type
				//filtered_obstacles has nothing
				if (fr.filtered_set.get(0) == 1.0)
				{
					for (Entity e: neighbor_entities)
					{
						if (e instanceof Agent)
						{
							filtered_entity.add(e);
						}
					}
				}
				//Want to sense only RECTANGLE obs entity
				//filtered_entity only has RECTANGLE type
				//filtered_obstacles has RECTANGLE type
				else if (fr.filtered_set.get(0) == 2.0)
				{
					for (Entity e: neighbor_entities)
					{
						if (e instanceof Obstacle_rectangle)
						{
							filtered_entity.add(e);
						}
					}
					for (Obstacle o: obstacles)
					{
						if (o instanceof Obstacle_rectangle)
						{
							filtered_obstacle.add(o);
						}
					}
				}
				//Want to sense only CIRCLE obs entity
				//filtered_entity only has CIRCLE type
				//filtered_obstacles has CIRCLE
				else if (fr.filtered_set.get(0) == 2.1)
				{
					for (Entity e: neighbor_entities)
					{
						if (e instanceof Obstacle_circle)
						{
							filtered_entity.add(e);
						}
					}
					for (Obstacle o: obstacles)
					{
						if (o instanceof Obstacle_circle)
						{
							filtered_obstacle.add(o);
						}
					}
				}
				//Want to sense only GOAL POINT entity
				//filtered_entity only has GOAL POINT
				//filter_obstalce has nothing
				else if (fr.filtered_set.get(0) == 3.1)
				{
					for (Entity e: neighbor_entities)
					{
						if (e instanceof Goal_point)
						{
							filtered_entity.add(e);
						}
					}
				}
			}
			//For now, this only for filter all obstacles -> include both circle and rectangle obs
			else if (fr.filtered_set.size() == 2)
			{
				for (Entity e: neighbor_entities)
				{
					if (e instanceof Obstacle_circle || e instanceof Obstacle_rectangle)
					{
						filtered_entity.add(e);
					}
				}
				for (Obstacle o: obstacles)
				{
					if (o instanceof Obstacle_circle || o instanceof Obstacle_rectangle)
					{
						filtered_obstacle.add(o);
					}
				}
			}
			
			//This should only have 1 list with distance = field of view
			ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = getHeadingOptionwithadpativeFOV(filtered_entity, filtered_obstacle, target_agent, 0);
			
			
			if (FOV_segment_dataStruct_list.size() == 0)
			{
				System.out.println("FOV segment list is empty -> should have one with distance = 60 - check SpaceReference_Static.java");
			}
			else
			{
				FOV_segment_dataStructure empty_segment_list = FOV_segment_dataStruct_list.get(0);
				empty_segment_list.FOV_segment_list.removeIf(n -> n.empty == false);
				
				for (FOV_segment s: empty_segment_list.FOV_segment_list)
				{
					if (!heading_option_value.contains(s.range_start))
					{
						heading_option_value.add(s.range_start);
					}
					
					if (!heading_option_value.contains(s.range_end))
					{
						heading_option_value.add(s.range_end);
					}
					
				}
				
			}

		}
		
		
		
		
		//This list should contain only 1 segment with distance = field of view
		//ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = getHeadingOptionwithadpativeFOV(neighbor_entities, obstacles, target_agent, 0);

		
		
		Collections.sort(heading_option_value);
		
		//Need to add more option here
		int current_process_heading = 0;
		int space_between_each_option = 15;
		int angle_distance_between_2_heading_option = 0;
		
		ArrayList<Integer> heading_option_value_more_option = new ArrayList<Integer>();
		
		for (int i = 0; i < 360;i++)
		{
			current_process_heading++;
			if (!heading_option_value.contains(current_process_heading))
			{
				angle_distance_between_2_heading_option++;
				
			}
			else
			{
				angle_distance_between_2_heading_option = 0;
				
			}
			
			if (angle_distance_between_2_heading_option == space_between_each_option)
			{
				heading_option_value_more_option.add(current_process_heading);
				angle_distance_between_2_heading_option = 0;
			}
		}
		
		for (int i: heading_option_value_more_option)
		{
			heading_option_value.add(i);
		}
		
		Collections.sort(heading_option_value);
		
		//Check if the agent is too near to one of the corner of a rectangle

		int start_angle_of_corner = 0;
		int end_angle_of_corner = 0;
		boolean near_an_angle = false;
		Position nearest_corner = null;
		double min_distance_to_corner = Double.MAX_VALUE;
		Obstacle_rectangle nearest_rectangle_ob = null;
		
		for (Obstacle o: obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				Position nearest_corner_temp = target_agent.fov.nearestCorner(target_agent, o);
				//Meaning the agent is too close to one corner
				if (nearest_corner_temp != null)
				{
					double distance_to_corner = target_agent.position.getDistanceBetween2Position(target_agent.position, nearest_corner_temp);
					
					//Means a corner is too near to the target agent
					if (distance_to_corner <= Main.global_var.agent_radius+2.5)
					{
						near_an_angle = true;
						if (distance_to_corner < min_distance_to_corner)
						{
							min_distance_to_corner = distance_to_corner;
							nearest_corner = new Position(nearest_corner_temp.x, nearest_corner_temp.y);
							nearest_corner.type = nearest_corner_temp.type;
							nearest_rectangle_ob = (Obstacle_rectangle) o;
						}
					}
					
				}
			}
		}
		
		if (nearest_corner != null && nearest_rectangle_ob != null)
		{
			//ArrayList<PositionAngle_DataStructure> itersections = new ArrayList<PositionAngle_DataStructure>();
			//double distance_to_corner = nearest_corner.getDistanceBetween2Position(nearest_corner, target_agent.position);
			ArrayList<PositionAngle_DataStructure> itersections = target_agent.fov.get2BoundInteresectionwithObstacle(target_agent, nearest_rectangle_ob, nearest_corner, Main.global_var.fov_distance);

			//Only add new segment if target agent intersects with rectangle obstacle at 2 different points.

			if (itersections.size() == 2)
			{


				//double dis = Math.sqrt(Math.pow(temp_x,2) + Math.pow(temp_y,2));

				//Is agent heads in or head out of the obstacle
				//if (dis >= target_agent.radius + 1)
				{

					//agent heads toward to obstacle

					//If somehow difference between head_start and head_end > 180
					//-> it means agent sense entity behind it, hence head_start and head_end need to be switched
					if (target_agent.fov.diffBetween2AnglesIncrease(itersections.get(0).angle, itersections.get(1).angle) <= 184)
					{
						start_angle_of_corner = itersections.get(0).angle;
						end_angle_of_corner = itersections.get(1).angle;

					}
					else
					{
						start_angle_of_corner = itersections.get(1).angle;
						end_angle_of_corner = itersections.get(0).angle;

					}
				}

				
			}
		}
		
		
		//for (int i = 0; i < 360; )
		for (int i: heading_option_value)
		{				
			//This min_distance is the shortest distance that target_agent can move
			//We need this because in many cases, one heading option can be block by many entities
			double min_overall_distance = Main.global_var.fov_distance + 1;
			double min_agent_travel_distance = Main.global_var.fov_distance + 1;
			double min_circle_ob_travel_distance = Main.global_var.fov_distance + 1;
			double min_rectangle_ob_travel_distance = Main.global_var.fov_distance + 1;
			double min_all_ob_travel_distance = Main.global_var.fov_distance + 1;
			double min_goal_point_travel_distance = Main.global_var.fov_distance + 1;
			
			for (Entity e: neighbor_entities)
			{
				if (e instanceof Agent || e instanceof Obstacle_circle || e instanceof Goal_point)
				{
					ArrayList<Position> intersection = intersectBetweenEntityandHeading(target_agent, e,i);

					//There is no intersection
					if (intersection.isEmpty() == true)
					{

					}
					else  
					{
						//Has exactly 1 intersection
						if (intersection.size() == 1)
						{
							double dis_to_i1 = target_agent.position.getDistanceBetween2Position(target_agent.position, intersection.get(0));

							if (e instanceof Agent)
							{
								if (dis_to_i1 < min_agent_travel_distance)
								{
									min_agent_travel_distance = dis_to_i1;
								}

								if (intersection.get(0).x == -1 && intersection.get(0).y == -1)
								{
									min_agent_travel_distance = 0;
								}
							}
							else if (e instanceof Obstacle_circle)
							{
								if (dis_to_i1 < min_circle_ob_travel_distance)
								{
									min_circle_ob_travel_distance = dis_to_i1;
								}

								if (dis_to_i1 < min_all_ob_travel_distance)
								{
									min_all_ob_travel_distance = dis_to_i1;
								}
								
								if (intersection.get(0).x == -1 && intersection.get(0).y == -1)
								{
									min_circle_ob_travel_distance = 0;
									min_all_ob_travel_distance = 0;
								}
							}
							else if (e instanceof Goal_point)
							{
								if (dis_to_i1 < min_goal_point_travel_distance)
								{
									min_goal_point_travel_distance = dis_to_i1;
								}
								
								if (intersection.get(0).x == -1 && intersection.get(0).y == -1)
								{
									min_goal_point_travel_distance = 0;
								}
							}
							
							if (dis_to_i1 < min_overall_distance)
							{
								min_overall_distance = dis_to_i1;

							}

							if (intersection.get(0).x == -1 && intersection.get(0).y == -1)
							{
								min_overall_distance = 0;
							}
						}
						//Has 2 intersections
						else if (intersection.size() == 2)
						{
							double dis_to_i1 = target_agent.position.getDistanceBetween2Position(target_agent.position, intersection.get(0));
							double dis_to_i2 = target_agent.position.getDistanceBetween2Position(target_agent.position, intersection.get(1));


							//In case of 2 intersection, we only care the one that gives smaller distance
							if (dis_to_i1 < dis_to_i2)
							{
								if (e instanceof Agent)
								{
									if (dis_to_i1 < min_agent_travel_distance)
									{
										min_agent_travel_distance = dis_to_i1;
									}
								}
								else if (e instanceof Obstacle_circle)
								{
									if (dis_to_i1 < min_circle_ob_travel_distance)
									{
										min_circle_ob_travel_distance = dis_to_i1;
										
									}
									
									if (dis_to_i1 < min_all_ob_travel_distance)
									{
										min_all_ob_travel_distance = dis_to_i1;
										
									}
									
								}
								else if (e instanceof Goal_point)
								{
									if (dis_to_i1 < min_agent_travel_distance)
									{
										min_goal_point_travel_distance = dis_to_i1;
									}
								}
								
								if (dis_to_i1 < min_overall_distance)
								{
									min_overall_distance = dis_to_i1;

								}
							}
							else
							{
								if (e instanceof Agent)
								{
									if (dis_to_i2 < min_agent_travel_distance)
									{
										min_agent_travel_distance = dis_to_i2;
									}
								}
								else if (e instanceof Obstacle_circle)
								{
									if (dis_to_i2 < min_circle_ob_travel_distance)
									{
										min_circle_ob_travel_distance = dis_to_i2;
									}
									
									if (dis_to_i2 < min_all_ob_travel_distance)
									{
										min_all_ob_travel_distance = dis_to_i2;
										
									}
								}
								else if (e instanceof Goal_point)
								{
									if (dis_to_i2 < min_agent_travel_distance)
									{
										min_goal_point_travel_distance = dis_to_i2;
									}
								}
								
								if (dis_to_i2 < min_overall_distance)
								{
									min_overall_distance = dis_to_i2;

								}
							}
						}
					}
				}

				for (Obstacle o: obstacles)
				{
				
					if (o instanceof Obstacle_rectangle)
					{
						boolean inside_block_segment_of_a_corner = false;
							
						//If it is too near an angle -> no need to check anything else
						if (near_an_angle == true)
						{
							if (start_angle_of_corner <= end_angle_of_corner)
							{	
								//The heading option is not intersect with the obstacle
								if (i > start_angle_of_corner && i < end_angle_of_corner)
								{
									min_rectangle_ob_travel_distance = 0;
									min_all_ob_travel_distance = 0;
									min_overall_distance = 0;
									inside_block_segment_of_a_corner = true;
								}
							}
							else
							{	
								//The heading option is not intersect with the obstacle
								if ((i > start_angle_of_corner && i <= 359) || (i >= 0 && i < end_angle_of_corner))
								{
									min_rectangle_ob_travel_distance = 0;
									min_all_ob_travel_distance = 0;
									min_overall_distance = 0;
									inside_block_segment_of_a_corner = true;
								}
							}
						}
						
						if (near_an_angle == false || (near_an_angle == true && inside_block_segment_of_a_corner == false))
						{
							Obstacle_rectangle ob_rec = (Obstacle_rectangle) o;
							FieldOfView fov_dummy = new FieldOfView();

							ReturnSenseObstacle sense_obs = fov_dummy.getRectangleObstacleDistanceWithinFOV(target_agent, i, ob_rec, 0);
							
							//Means none of the corner is too close and agent can sense the obstacle
							if (sense_obs != null)
							{
								if (sense_obs.distance - 5 < Main.global_var.fov_distance)
								{
									if (sense_obs.distance - 5 < min_rectangle_ob_travel_distance)
									{
										min_rectangle_ob_travel_distance = sense_obs.distance - 5;
									}
									
									if (sense_obs.distance -5 < min_all_ob_travel_distance)
									{
										min_all_ob_travel_distance = sense_obs.distance -5;
										
									}
									
									if (sense_obs.distance - 5 < min_overall_distance)
									{
										min_overall_distance = sense_obs.distance - 5;
									}

									//If target_agent is already too close too an edge of the obstacle
									//Agent inside TOP EDGE zone
									if (target_agent.position.x >= ob_rec.pos1.x && target_agent.position.x <= ob_rec.pos2.x && target_agent.position.y < ob_rec.pos1.y)
									{
										//Too close to TOP EDGE
										if(Math.abs(target_agent.position.y - ob_rec.pos1.y) < Main.global_var.agent_radius + 2.5)
										{
											if (i > 180 && i < 360)
											{
												min_rectangle_ob_travel_distance = 0;
												min_all_ob_travel_distance = 0;
												min_overall_distance = 0;
											}
										}
									}
									//Agent inside RIGHT EDGE zone
									else if (target_agent.position.x > ob_rec.pos2.x && target_agent.position.y >= ob_rec.pos2.y && target_agent.position.y <= ob_rec.pos3.y)
									{
										//too close to the RIGHT EDGE
										if(Math.abs(target_agent.position.x - ob_rec.pos2.x) < Main.global_var.agent_radius + 2.5)
										{
											if (i > 90 && i < 270)
											{
												min_rectangle_ob_travel_distance = 0;
												min_all_ob_travel_distance = 0;
												min_overall_distance = 0;
											}

										}
									}
									//Agent inside BOTTOM EDGE zone
									else if (target_agent.position.x >= ob_rec.pos4.x && target_agent.position.x <= ob_rec.pos3.x && target_agent.position.y > ob_rec.pos3.y)
									{
										//too close to the BOTTOM EDGE
										if(Math.abs(target_agent.position.y - ob_rec.pos3.y) < Main.global_var.agent_radius + 2.5)
										{
											if (i > 0 && i < 180)
											{
												min_rectangle_ob_travel_distance = 0;
												min_all_ob_travel_distance = 0;
												min_overall_distance = 0;
											}
										}
									}
									//Agent inside LEFT EDGE zone
									else if (target_agent.position.x < ob_rec.pos1.x && target_agent.position.y >= ob_rec.pos1.y && target_agent.position.y <= ob_rec.pos4.y)
									{
										//too close to the LEFT EDGE
										if (Math.abs(target_agent.position.x - ob_rec.pos4.x) < Main.global_var.agent_radius + 2.5)
										{
											if ( (i > 270 && i <= 360) || (i >= 0 && i < 90))
											{
												min_rectangle_ob_travel_distance = 0;
												min_all_ob_travel_distance = 0;
												min_overall_distance = 0;
											}
										}
									}
								}
							}
						}
						

					}
					
					
				}


			}

			//Meaning this heading does not block by any entity
			if (min_overall_distance == Double.MAX_VALUE)
			{
				SpaceHeadingEntity new_heading = new SpaceHeadingEntity(i,0,0,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance,Main.global_var.fov_distance, Main.global_var.fov_distance, Main.global_var.fov_distance);

				heading_option.add(new_heading);
			}
			else
			{
				//head_value, angle_distance_to_desired, angle_distance_to_current, 
				//distance_travel, d_travel_to_entity, d_travel_to_agent, d_travel_to_circle_obs, d_travel_to_rec_obs
				//If min_overall_distance is 0 -> agent cannot move in this direction -> should not be included
				//	if (min_overall_distance > 0)
				{
					SpaceHeadingEntity new_heading = new SpaceHeadingEntity(i,0,0,min_overall_distance,min_overall_distance,min_agent_travel_distance,min_circle_ob_travel_distance,min_rectangle_ob_travel_distance,min_all_ob_travel_distance, min_goal_point_travel_distance);

					heading_option.add(new_heading);
				}

			}


			i+= space_between_each_option;
		}


		return heading_option;
	}

	public ArrayList<Position> intersectBetweenEntityandHeading(Agent target_agent, Entity e, int heading)
	{
		ArrayList<Position> intersection = new ArrayList<Position>();

		Position posA = target_agent.position;
		Position posB = target_agent.position.setNextPositionFromAngleAndSpeed(posA, heading, Main.global_var.fov_distance);

		Position center = new Position(0,0);
		double radius = 0;
		if (e instanceof Agent || e instanceof Obstacle_circle || e instanceof Goal_point)
		{
			if (e instanceof Agent)
			{
				Agent a = (Agent) e;
				center = a.position;
				radius = a.radius + Main.global_var.agent_radius + 2;
			}
			else if (e instanceof Obstacle_circle)
			{
				Obstacle_circle o_c = (Obstacle_circle) e;
				center = o_c.pos;
				radius = o_c.radius + Main.global_var.agent_radius + 2;
			}
			else if (e instanceof Goal_point)
			{
				Goal_point g_p = (Goal_point) e;
				center = g_p.position;
				radius = g_p.radius + Main.global_var.agent_radius + 2;
			}
			
			double distance_to_e = target_agent.position.getDistanceBetween2Position(target_agent.position, center);

			//Means they are too close and overlap
			if (distance_to_e <= radius)
			{
				ArrayList<PositionAngle_DataStructure> tangent = target_agent.fov.get2TangentLinewithCricleObstacle(target_agent, center, radius, false);

				int tangent_head_start = tangent.get(0).angle;
				int tangent_head_end = tangent.get(1).angle;
				//tangle line is Q1 and Q4
				if ( tangent_head_start > tangent_head_end)
				{
					//If inside tangent range -> distance travel = 0;
					if (heading > tangent_head_start && heading <= 360 || heading >= 0 && heading < tangent_head_end)
					{
						intersection.clear();
						intersection.add(new Position(-1,-1));
					}
					else
					{
						intersection.clear();
					}
				}
				//Anything else
				else
				{
					if (heading > tangent_head_start && heading < tangent_head_end)
					{
						intersection.clear();
						intersection.add(new Position(-1,-1));
					}
					else
					{
						intersection.clear();
					}
				}
			}
			else
			{
				double baX = posB.x - posA.x;
				double baY = posB.y - posA.y;
				double caX = center.x - posA.x;
				double caY = center.y - posA.y;

				double a = baX * baX + baY * baY;
				double bBy2 = baX * caX + baY * caY;
				double c = caX * caX + caY * caY - radius * radius;

				double pBy2 = bBy2 / a;
				double q = c / a;

				double disc = pBy2 * pBy2 - q;

				if (disc < 0) 
				{
					//Should be empty here
					return intersection;
				}

				// if disc == 0 ... dealt with later
				double tmpSqrt = Math.sqrt(disc);
				double abScalingFactor1 = -pBy2 + tmpSqrt;
				double abScalingFactor2 = -pBy2 - tmpSqrt;

				Position i1 = new Position(posA.x - baX * abScalingFactor1, posA.y - baY * abScalingFactor1);

				if (disc == 0) 
				{ 
					if (i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
							|| i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001 )
					{
						// abScalingFactor1 == abScalingFactor2
						intersection.add(i1);

					}

					return intersection;
				}

				Position i2 = new Position(posA.x - baX * abScalingFactor2,  posA.y - baY * abScalingFactor2);

				/*
    	        System.out.println("d1 " + i1.getDistanceBetween2Position(posA, i1));
    	        System.out.println("d2 " + i1.getDistanceBetween2Position(i1, posB));
    	        System.out.println("d3 " + posA.getDistanceBetween2Position(posA, posB));
				 */

				//Both intersection must be between point A and point B
				if (i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001 
						&&
						i2.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001)
				{
					// abScalingFactor1 == abScalingFactor2
					intersection.add(i1);
					intersection.add(i2);
				}
				//i1 is in middle but not i2
				else if (i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001 
						&&
						!(i2.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001))
				{
					//
					if (i2.getDistanceBetween2Position(posA, i2) > Main.global_var.fov_distance)
					{
						intersection.add(i1);
					}

				}
				//i2 is in middle but not i1
				else if (!(i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i1) + i1.getDistanceBetween2Position(i1, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001 )
						&&
						i2.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) >= posA.getDistanceBetween2Position(posA, posB) - 0.001
						&& i1.getDistanceBetween2Position(posA, i2) + i2.getDistanceBetween2Position(i2, posB) <= posA.getDistanceBetween2Position(posA, posB) + 0.001)
				{
					if (i1.getDistanceBetween2Position(posA, i1) > Main.global_var.fov_distance)
					{
						intersection.add(i2);
					}

				}
				//both i1 and i2 are not in middle of point A and B and their distance is within FOV -> must be overlap each other or very close
				//Already take care above 
				else
				{

				}


				return intersection;
			}




		}

		return intersection;
	}

	


	//This function is nearly identical to getEntitywithAdpativeFOV in FilefofView.java
	//But no distance layer, FOV of agent are always = filed of view distance.
	public ArrayList<FOV_segment_dataStructure> getHeadingOptionwithadpativeFOV(ArrayList<Entity> entities, ArrayList<Obstacle> obstacles, Agent target_agent, int timesteps)
	{
		//ArrayList<PositionAngle_DataStructure> test = get2TangentLinewithCricleObstacle(target_agent, new Position(50,50),5,false);
		entities.removeIf(e -> e.remove == true);

		ArrayList<FOV_segment_dataStructure> FOV_seg_dataStruct = new ArrayList<FOV_segment_dataStructure>();
		//This list return occupied zone and a list of agent inside it
		ArrayList<FOV_segment> return_list = new ArrayList<FOV_segment>();

		ArrayList<Obstacle> sense_obstacle = new ArrayList<Obstacle>();

		//For now, this adaptiveFOV will get all segment for 360 view
		//We will filter which segment withinFOV range later on in Model.java file.

		int FOV_start = (int) (target_agent.heading.value - 360/2);
		int FOV_end = (int) (target_agent.heading.value + 360/2);

		if (FOV_start < 0)
		{
			FOV_start = 360 + FOV_start;
		}

		if (FOV_end > 360)
		{
			FOV_end = FOV_end - 360;
		}

		//Get the nearest corner of polygon obstacles to use later on

		for (Obstacle o : obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				//this nearest point first will find the nearest corner
				Position nearest_point = target_agent.fov.nearestCorner(target_agent, o);

				Obstacle_rectangle ob_rec = (Obstacle_rectangle) o;

				double min_distance = Double.MAX_VALUE;

				if (nearest_point != null)
				{
					min_distance = Math.sqrt(Math.pow(target_agent.position.x - nearest_point.x, 2) + Math.pow(target_agent.position.y - nearest_point.y, 2));
				}

				//Next, agent will find the actual nearest point to the obstacle
				//4 cases below only happens if agents are in TOP, RIGHT, BOTTOM, LEFT area.
				//Need to find the nearest point of the target_agent to the obstacle
				//Agent inside TOP EDGE zone
				if (target_agent.position.x >= ob_rec.pos1.x && target_agent.position.x <= ob_rec.pos2.x && target_agent.position.y < ob_rec.pos1.y)
				{

					double distance = Math.abs(target_agent.position.y - ob_rec.pos1.y) - Main.global_var.agent_radius;
					if (distance < min_distance && distance < Main.global_var.fov_distance)
					{
						min_distance = distance;
						nearest_point = new Position(target_agent.position.x, ob_rec.pos1.y);
						nearest_point.type = "e_top";
					}
				}
				//Agent inside RIGHT EDGE zone
				else if (target_agent.position.x > ob_rec.pos2.x && target_agent.position.y >= ob_rec.pos2.y && target_agent.position.y <= ob_rec.pos3.y)
				{

					double distance = Math.abs(ob_rec.pos2.x - target_agent.position.x) - Main.global_var.agent_radius;

					if (distance < min_distance && distance < Main.global_var.fov_distance)
					{
						min_distance = distance;
						nearest_point = new Position(ob_rec.pos2.x, target_agent.position.y);
						nearest_point.type = "e_right";
					}
				}
				//Agent inside BOTTOM EDGE zone
				else if (target_agent.position.x >= ob_rec.pos4.x && target_agent.position.x <= ob_rec.pos3.x && target_agent.position.y > ob_rec.pos3.y)
				{

					double distance = Math.abs(target_agent.position.y- ob_rec.pos3.y) - Main.global_var.agent_radius;
					if (distance < min_distance && distance < Main.global_var.fov_distance)
					{
						min_distance = distance;
						nearest_point = new Position(target_agent.position.x, ob_rec.pos3.y);
						nearest_point.type = "e_bottom";
					}

				}
				//Agent inside LEFT EDGE zone
				else if (target_agent.position.x < ob_rec.pos1.x && target_agent.position.y >= ob_rec.pos1.y && target_agent.position.y <= ob_rec.pos4.y)
				{

					double distance = Math.abs(ob_rec.pos1.x- target_agent.position.x) - Main.global_var.agent_radius;
					if (distance < min_distance && distance < Main.global_var.fov_distance)
					{
						min_distance = distance;
						nearest_point = new Position(ob_rec.pos1.x, target_agent.position.y);
						nearest_point.type = "e_left";
					}
				}

				if (nearest_point != null)
				{ 
					if (nearest_point.type.contains("e_"))
					{
						Agent add_agent = new  Agent(nearest_point, 0, 0, 1.0);
						add_agent.position.type = nearest_point.type;


						entities.add(add_agent);
					}

				}

				//This list should contains exactly 2 bounds intersection of target agent and obstacles.
				ArrayList<PositionAngle_DataStructure> itersections = target_agent.fov.get2BoundInteresectionwithObstacle(target_agent, o, nearest_point, target_agent.fov.view_distance);

				//pa contains list of intersection positions
				//the agents are added are dummy agents
				//We need them to define the radius, and find adaptive distance for FOV
				if (itersections.size() != 0)
				{
					for (PositionAngle_DataStructure pa : itersections)
					{
						double temp_x = target_agent.position.x - pa.position.x;
						double temp_y = target_agent.position.y - pa.position.y;

						double dis = Math.sqrt(Math.pow(temp_x,2) + Math.pow(temp_y,2));

						if (dis <=  target_agent.fov.view_distance + 0.1)
						{
							Agent add_agent = new  Agent(pa.position, 0, 0, 1.0);
							add_agent.position.type = pa.position.type;


							entities.add(add_agent);
						}


					}

					if (itersections.size() == 2)
					{
						if (itersections.get(0).position.x == itersections.get(1).position.x
								&& itersections.get(0).position.y == itersections.get(1).position.y)
						{
							if (entities.size() > 1)
							{
								entities.remove(entities.size()-1);
								o.intersect_in_corner = true;
							}

						}
					}

					sense_obstacle.add(o);
				}


			}
			else if (o instanceof Obstacle_circle)
			{
				Obstacle_circle oc = (Obstacle_circle) o;

				double dis = Math.sqrt(Math.pow(target_agent.position.x - oc.pos.x, 2) + Math.pow(target_agent.position.y - oc.pos.y, 2));

				//First condition
				//Distance need to be short enough
				if (dis < oc.radius + target_agent.fov.view_distance)
				{

					boolean dublicate = false;

					for (Entity e : entities)
					{
						if (e.equals(oc) == true)
						{
							dublicate = true;
						}
					}

					if (dublicate == false)
					{
						if ((target_agent.fov.getEntityIn_First_Last_Segment(target_agent, oc, FOV_start)) == true 
								|| (target_agent.fov.getEntityIn_First_Last_Segment(target_agent, oc, FOV_end)) == true)
						{
							oc.always_sense = true;
							entities.add(oc);
						}

					}
				}

			}
		}



		return_list = new ArrayList<FOV_segment>();

		for (Entity e: entities)
		{
			if (e instanceof Agent || e instanceof Obstacle_circle)
			{
				Position pos_e = null;
				int radius_e = 0;
				double distance_to_ob = 0;

				//This imagination checking is to see if e is the imagination agent 
				//That present intersection between target_agent and a rectangle obstacle.
				boolean imagination_agent = false;

				if (e instanceof Agent)
				{
					Agent a = (Agent) e;

					pos_e = a.position;

					if (e.warp == true)
					{
						pos_e = target_agent.position.getWarpPosition(target_agent.position, a.position);
					}

					radius_e = target_agent.radius;

					if (a.position.type.contains("intersect_with_rectangle") || a.position.type.contains("e_"))
					{
						imagination_agent = true;
						a.remove = true;
					}


				}
				else if (e instanceof Obstacle_circle)
				{
					Obstacle_circle oc = (Obstacle_circle) e;
					pos_e = oc.pos;

					if (e.warp == true)
					{
						pos_e = target_agent.position.getWarpPosition(target_agent.position, oc.pos);
					}

					radius_e = oc.radius;
					distance_to_ob = e.distance;

				}


				//if (sense_entity == true)
				{
					if (imagination_agent == false)
					{
						ArrayList<PositionAngle_DataStructure> tangent_set = target_agent.fov.get2TangentLinewithCricleObstacle(target_agent, pos_e, radius_e,imagination_agent) ;


						int head_start = tangent_set.get(0).angle;
						//head_start -= 10;

						int head_end = tangent_set.get(1).angle;
						//head_end += 10;

						//if the heading direction toward to circle is opposite of current heading direction
						//-> agent does not sense it.
						int bound_limit = 0;

						if (distance_to_ob > 18)
						{
							bound_limit = Main.global_var.fov_angle/2 - 40;
						}
						else
						{
							bound_limit = Main.global_var.fov_angle/2;
						}


						FOV_segment a_segment = null;

						//If somehow difference between head_start and head_end > 180
						//-> it means agent sense entity behind it, hence head_start and head_end need to be switched
						if (target_agent.fov.diffBetween2AnglesIncrease(head_start, head_end) <= 184)
						{
							a_segment = new FOV_segment(head_start, head_end);
						}
						else
						{
							a_segment = new FOV_segment(head_end, head_start);
						}

						e.sense = true;
						a_segment.add_one_entity(e);

						a_segment.empty = false;
						return_list.add(a_segment);

						//This intersection is computed by the set of 1st intersection
						//1 set of intersection serve as adaptive point to find radius
					}

				}

			}

		}




		for (Obstacle o : obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				//This list should contains all bound itesection of target agent and obstacles.
				//For each obstacle, this list should return only 2 elements

				Position nearest_corner = target_agent.fov.nearestCorner(target_agent, o);

				ArrayList<PositionAngle_DataStructure> itersections = target_agent.fov.get2BoundInteresectionwithObstacle(target_agent, o, nearest_corner, Main.global_var.fov_distance);

				//Only add new segment if target agent intersects with rectangle obstacle at 2 different points.

				if (itersections.size() == 2)
				{

					double temp_x = target_agent.position.x - itersections.get(0).position.x ;
					double temp_y = target_agent.position.y - itersections.get(0).position.y ;

					double dis = Math.sqrt(Math.pow(temp_x,2) + Math.pow(temp_y,2));

					//Is agent heads in or head out of the obstacle
					//if (dis >= target_agent.radius + 1)
					{
						FOV_segment a_segment = null;
						//agent heads toward to obstacle

						//If somehow difference between head_start and head_end > 180
						//-> it means agent sense entity behind it, hence head_start and head_end need to be switched
						if (target_agent.fov.diffBetween2AnglesIncrease(itersections.get(0).angle, itersections.get(1).angle) <= 184)
						{
							a_segment = new FOV_segment(itersections.get(0).angle, itersections.get(1).angle);
						}
						else
						{
							a_segment = new FOV_segment(itersections.get(1).angle, itersections.get(0).angle);
						}

						o.sense = true;
						a_segment.add_one_entity(o);

						a_segment.empty = false;
						return_list.add(a_segment);

					}
					


				}

			}
		}

		////////////////////////////////////////////
		FOV_seg_dataStruct.add(new FOV_segment_dataStructure(return_list, Main.global_var.fov_distance));


		//This means there is no occupied segment
		//The whole FOV is empty
		if (FOV_seg_dataStruct.size() == 0)
		{
			FOV_segment a_segment = null;
			//Means the FOV is 360
			if (FOV_start == FOV_end)
			{
				a_segment = new FOV_segment(0, 359);
			}
			else
			{
				a_segment = new FOV_segment(FOV_start, FOV_end);
			}

			a_segment.empty = true;
			return_list.add(a_segment);

			//If all FOV is empty -> default distance is the max distance = fov_distance
			FOV_seg_dataStruct.add(new FOV_segment_dataStructure(return_list, Main.global_var.fov_distance));
		}
		else
		{
			boolean check_nearest_e = false;
			boolean add_360_empty_segment = false;
			double empty_360_distance = 0;
			FOV_segment empty_360_segment = null;

			ArrayList<FOV_segment> return_list_360_segment = new ArrayList<FOV_segment>();
			//This list contains a list of segments
			//These segment contain details of which segment is empty from target agent point of view to  for each neighbor entity 
			for (FOV_segment_dataStructure fov_s_dataStruct : FOV_seg_dataStruct)
			{
				//If one segment is empty
				//Mean the whole FOV is empty
				if (fov_s_dataStruct.FOV_segment_list.size() == 0)
				{
					FOV_segment a_segment = null;
					//Means the FOV is 360
					if (FOV_start == FOV_end)
					{
						a_segment = new FOV_segment(0, 359);
					}
					else
					{
						a_segment = new FOV_segment(FOV_start, FOV_end);
					}

					a_segment.empty = true;
					return_list.add(a_segment);

					fov_s_dataStruct.FOV_segment_list.add(a_segment); 

					//If all FOV is empty -> default distance is the max distance = fov_distance
					//break;
				}
				else
				{
					//If start range > end range -> the segment is on 1st and 4th quadrant 
					//Need to split into 2 segments [start-359], [0-end]
					//For now, we don't care about the agent belong to which segment
					//Take care for segemnt with entity
					ArrayList<FOV_segment> new_list = new ArrayList<FOV_segment>();
					ArrayList<FOV_segment> fov_s_list = fov_s_dataStruct.FOV_segment_list;

					int space_to_be_true_empty = 2;

					for (FOV_segment fov_s : fov_s_list)
					{
						if (fov_s.range_start > fov_s.range_end)
						{
							FOV_segment fov_s1 = new FOV_segment(fov_s.range_start,359);
							fov_s1.empty = false;

							FOV_segment fov_s2 = new FOV_segment(0,fov_s.range_end);
							fov_s2.empty = false;

							//for now, the entity belong to fov_s2
							fov_s2.add_entity_list(fov_s.FOV_segment_entity);

							new_list.add(fov_s1);
							new_list.add(fov_s2);

							fov_s.remove = true;
						}
					}

					fov_s_list.removeIf(n -> n.remove == true);

					//Add the split list to return_list
					for (FOV_segment fov_s : new_list)
					{
						fov_s_list.add(fov_s);
					}

					/*
			     		fov_s_list.clear();

			     		fov_s_list.add(new FOV_segment(260,270));
			     		fov_s_list.add(new FOV_segment(274,290));
			     		fov_s_list.add(new FOV_segment(290,320));
			     		//fov_s_list.add(new FOV_segment(220,230));
					 */

					if (fov_s_list.size() != 0)
					{
						//return_list should contain all segment that has agents inside it, lower bound and upper bound
						//next step is to merge them into a larger segment
						Stack<FOV_segment> fov_stack = new Stack<>();

						//Sorting like time order
						Collections.sort(fov_s_list, new Comparator<FOV_segment>()
						{
							public int compare(FOV_segment s1, FOV_segment s2)
							{
								return s1.range_start - s2.range_start;
							}
						});


						//Push the first segment to the stack
						fov_stack.push(fov_s_list.get(0));

						for (int i = 1; i < fov_s_list.size(); i++)
						{
							FOV_segment top_segment = fov_stack.peek();

							if (top_segment.range_end < fov_s_list.get(i).range_start - space_to_be_true_empty)
							{
								fov_stack.push(fov_s_list.get(i));
							}
							else if (top_segment.range_end < fov_s_list.get(i).range_end)
							{
								top_segment.range_end = fov_s_list.get(i).range_end;
								top_segment.add_entity_list(fov_s_list.get(i).FOV_segment_entity);
								fov_stack.pop();
								fov_stack.push(top_segment);
							}
						}

						//Update the return list
						fov_s_list.clear();

						while (fov_stack.isEmpty() == false)
						{
							FOV_segment s = fov_stack.pop();

							fov_s_list.add(s);
						}
					}

					//return list at this point contain all occupied segments
					//The other segment within FOV is true empty segment
					//Include the true empty segment to the FOV segment list
					//Sorting like time order



					//Testing purpose
					/*
			     		fov_s_list.clear();

			     		fov_s_list.add(new FOV_segment(5,10));
			     		fov_s_list.add(new FOV_segment(20,30));
			     		fov_s_list.add(new FOV_segment(300,355));
			     		//fov_s_list.add(new FOV_segment(220,230));
					 */

					//Sorting like time order
					Collections.sort(fov_s_list, new Comparator<FOV_segment>()
					{
						public int compare(FOV_segment s1, FOV_segment s2)
						{
							return s1.range_start - s2.range_start;
						}
					});

					ArrayList<FOV_segment> empty_segment_list = new ArrayList<FOV_segment>();

					FOV_start = (int) (target_agent.heading.value - 360/2);
					FOV_end = (int) (target_agent.heading.value + 360/2);


					//There is no entity in the whole FOV
					if (fov_s_list.size() == 0)
					{

						if (FOV_start < 0)
						{
							FOV_start = FOV_start + 360;
						}

						if (FOV_end > 360)
						{
							FOV_end = FOV_end - 360;
						}

						FOV_segment empty_segment = new FOV_segment(FOV_start, FOV_end);

						fov_s_list.add(empty_segment);
					}
					else
					{
						//For FOV = 360, no need to check FOV_start and FOV_end
						//All fov_segment at this point should contain all sorted occupied segments
						//With range from 0 - 359
						//And the compliment should be true empty space.
						//Deal with cases where there is only one occupied segment
						if (fov_s_list.size() == 1)
						{
							FOV_segment seg = fov_s_list.get(0);

							//occupied segment has range [0-end]
							if (seg.range_start == 0)
							{
								empty_segment_list.add(new FOV_segment(seg.range_end, 359));
							}
							//occupied segment has range [start-359]
							else if (seg.range_end == 359)
							{
								empty_segment_list.add(new FOV_segment(0, seg.range_start));
							}
							//remain cases
							else
							{
								empty_segment_list.add(new FOV_segment(0, seg.range_start));
								empty_segment_list.add(new FOV_segment(seg.range_end, 359));
							}
						}
						//There are at least 2 occupied segment
						else
						{
							for (int i = 0; i < fov_s_list.size(); i++)
							{
								if (i == 0)
								{
									if (fov_s_list.get(i).range_start > 0)
									{
										empty_segment_list.add(new FOV_segment(0,fov_s_list.get(0).range_start));
										empty_segment_list.add(new FOV_segment(fov_s_list.get(i).range_end,fov_s_list.get(i+1).range_start));


									}
									else
									{
										empty_segment_list.add(new FOV_segment(fov_s_list.get(i).range_end,fov_s_list.get(i+1).range_start));
									}

								}
								else if (i > 0 && i < fov_s_list.size() - 1)
								{
									empty_segment_list.add(new FOV_segment(fov_s_list.get(i).range_end,fov_s_list.get(i+1).range_start));
								}
								else if (i == fov_s_list.size() - 1)
								{
									if (fov_s_list.get(i).range_end < 359)
									{
										empty_segment_list.add(new FOV_segment(fov_s_list.get(i).range_end, 359));
									}

								}
							}
						}

					}


					//Add the split list to return_list
					for (FOV_segment fov_s : empty_segment_list)
					{
						//If range start and range_end is equal
						//-> should not add 

						if (fov_s.range_start == 75 && fov_s.range_end == 75)
						{
							System.out.println("Test");
						}

						if (fov_s.range_start != fov_s.range_end)
						{
							fov_s.empty = true;
							fov_s_list.add(fov_s);
						}

					}

					//Adding a 360 empty space if the space between nearest agent and target agent is greater than a threshold.
					if (check_nearest_e == false)
					{
						check_nearest_e = true;

						if (fov_s_dataStruct.radius >= Main.global_var.agent_personal_space + Main.global_var.empty_space_therhold - Main.global_var.agent_radius)
						{
							int head_start = 0;
							int head_end = 0;

							boolean too_near = false;

							//Need to check if the agent is too near edge of an obstacles.
							//If that is a case, then the new nearest empty space will not be 360 anymore
							//We need to substract the occupied area with the obstacle.
							for (Obstacle o : obstacles)
							{
								if (o instanceof Obstacle_rectangle)
								{

									Obstacle_rectangle ob_rec = (Obstacle_rectangle) o;

									double x = target_agent.position.x;
									double y = target_agent.position.y;

									if ((x < ob_rec.pos1.x && y < ob_rec.pos1.y) || (x > ob_rec.pos2.x && y < ob_rec.pos2.y) || (x > ob_rec.pos2.x && y > ob_rec.pos3.y) ||  (x < ob_rec.pos4.x && y > ob_rec.pos4.y))
									{
										/*
			  								int heading_to_e = target_agent.position.convertFromPositionToAngle(target_agent.position, imagination_agent_pos);

			  								head_start = heading_to_e - 90 - 2;

			  								if (head_start < 0)
			  								{
			  									head_start = 360 + head_start;
			  								}

			  								head_end = heading_to_e + 90 + 2;

			  								if (head_end >= 360)
			  								{
			  									head_end = head_end - 360;
			  								}
										 */
									}
									//TOP
									else if (x >= ob_rec.pos1.x && x <= ob_rec.pos2.x && y < ob_rec.pos1.y && Math.abs(y - ob_rec.pos1.y) <= Main.global_var.agent_personal_space + Main.global_var.empty_space_therhold)
									{
										head_start = 0;
										head_end = 180;
										too_near = true;
										break;
									}
									//TOP-RIGHT
									else if (x > ob_rec.pos2.x && y < ob_rec.pos2.y)
									{

									}
									//RIGHT
									else if (x > ob_rec.pos2.x && y >= ob_rec.pos2.y && y <= ob_rec.pos3.y && Math.abs(x - ob_rec.pos2.x) <= Main.global_var.agent_personal_space + Main.global_var.empty_space_therhold)
									{
										head_start = 270;
										head_end = 90;
										too_near = true;
										break;

									}
									//RIGHT-BOTTOM
									else if (x > ob_rec.pos2.x && y > ob_rec.pos3.y)
									{

									}
									//BOTTOM
									else if (x >= ob_rec.pos4.x && x <= ob_rec.pos3.x && y > ob_rec.pos3.y && Math.abs(x - ob_rec.pos3.y) <= Main.global_var.agent_personal_space + Main.global_var.empty_space_therhold)
									{
										head_start = 180;
										head_end = 359;
										too_near = true;
										break;

									}
									//BOTTOM-LEFT
									else if (x < ob_rec.pos4.x && y > ob_rec.pos4.y)
									{

									}
									//LEFT
									else if (x < ob_rec.pos1.x && y >= ob_rec.pos1.y && y <= ob_rec.pos4.y && Math.abs(x - ob_rec.pos1.x) <= Main.global_var.agent_personal_space + Main.global_var.empty_space_therhold)
									{
										head_start = 90;
										head_end = 270;
										too_near = true;
										break;
									}
								}
							}

							if (too_near == true)
							{
								add_360_empty_segment = true;
								empty_360_segment = new FOV_segment(head_start, head_end);

							}
							else
							{
								add_360_empty_segment = true;
								empty_360_segment = new FOV_segment(0, 359);

							}

							empty_360_segment.empty = true;
							return_list_360_segment.add(empty_360_segment);
							empty_360_distance = fov_s_dataStruct.radius - Main.global_var.agent_radius;
						}
					}
				}

			}

			/*
			if (add_360_empty_segment == true)
			{
				//return_list.add(a_segment);

				//If all FOV is empty -> default distance is the max distance = fov_distance
				FOV_seg_dataStruct.add(0,new FOV_segment_dataStructure(return_list_360_segment, empty_360_distance));
			}
			 */

		}


		return FOV_seg_dataStruct;
	}
}





