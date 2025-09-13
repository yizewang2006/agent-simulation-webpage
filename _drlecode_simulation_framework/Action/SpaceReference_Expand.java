package Action;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.Random;

import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import SpaceHeadingEntity.SpaceHeadingEntity;
import agents.Agent;
import agents.FOV_segment;
import agents.FOV_segment_dataStructure;
import agents.Position;
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

public class SpaceReference_Expand extends Action
{
	//act_on_empty_space
	// 0 -> not act on
	// 1 -> act on
	public int act_on_empty_space = 1;

	// 1 -> nearest_desired
	// 2 -> farthest 
	// 3 -> nearest_turning
	// 4 -> density within [-5,5]
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
	
	public SpaceReference_Expand()
	{
		
	}
	
	//Set a random space bahvior
	//extract_property for space behavior is always angle - at least for now
	public SpaceReference_Expand(double extract_p)
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
		this.filter_chain = f.setRandomFilterChain(new SpaceReference_Expand());
		
	}


	//Preset a space behavior
	public SpaceReference_Expand(double offset, ArrayList<Filter> filter_c, int act_on_empty_s, int FOV_zone_com_f, int FOV_distance_o, double extract_p)
	{
		super(2, extract_p, offset);
		this.act_on_empty_space = act_on_empty_s;
		this.act_on_space_property = FOV_zone_com_f;
		this.heading_option_combination = FOV_distance_o;
		this.filter_chain = filter_c;
	}


	public double getReferenceValue(ArrayList<Entity> neighbor_entities, ArrayList<Obstacle> obstacles, ArrayList<Goal> goals, Agent target_agent, boolean for_action)
	{

		//Angle behavior
		if(extract_property == 1 || extract_property == 2.0 || extract_property == 2.1)
		{
			double heading_original = target_agent.heading.value;
			double heading = target_agent.heading.value;
			//heading += current_behavior.offset;

			ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = target_agent.fov.getEntityWithAdaptiveFOV(neighbor_entities, obstacles, target_agent, 0);

			//Apply FOV start and FOV end here
			int view_angle = target_agent.fov.view_angle;

			int FOV_start = (int) (target_agent.heading.value - view_angle/2);
			int FOV_end = (int) (target_agent.heading.value + view_angle/2);

			if (FOV_start < 0)
			{
				FOV_start = 360 + FOV_start;
			}

			if (FOV_end >= 360)
			{
				FOV_end = FOV_end - 360;
			}

			ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list_withinFOV = new ArrayList<FOV_segment_dataStructure>();

			if (Main.global_var.fov_angle != 360)
			{
				for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list)
				{

					ArrayList<FOV_segment> temp_seg = new ArrayList<FOV_segment>();

					for (FOV_segment f : fsd.FOV_segment_list)
					{
						//Scan from heading to FOV_start first -> counter clockwise
						int scan_value= FOV_start;
						boolean include_range_start = false;
						boolean include_range_end = false;
						boolean reverse_case = false;

						while (scan_value != FOV_end)
						{

							if (f.range_start == scan_value)
							{
								include_range_start = true;

							}

							if (f.range_end == scan_value)
							{
								include_range_end = true;
								//Meaning for this segment, the scan value hits the range_end before range_start

								if (include_range_start == false)
								{
									reverse_case = true;
									FOV_segment temp_end_segment = new FOV_segment(FOV_start, f.range_end);
									temp_end_segment.empty = f.empty;

									temp_seg.add(temp_end_segment);
									//At the moment the reverse case is true,
									//We work all the way to the check for f.range_start here as well, 
									//Then we break the loop.
									while(scan_value != FOV_end)
									{

										if (f.range_start == scan_value)
										{
											FOV_segment temp_start_segment = new FOV_segment(f.range_start, FOV_end);
											temp_start_segment.empty = f.empty;

											temp_seg.add(temp_start_segment);
											break;
										}

										if (scan_value == 359)
										{
											scan_value = -1;
										}

										scan_value++;
									}
									break;
								}
							}

							if (scan_value == 359)
							{
								scan_value = -1;
							}

							scan_value++;
						}

						if (reverse_case == false)
						{
							if (include_range_start == true && include_range_end == true)
							{
								temp_seg.add(f);
							}

							else if (include_range_start == true && include_range_end == false)
							{
								FOV_segment temp = new FOV_segment(f.range_start, FOV_end);
								temp.empty = f.empty;

								temp_seg.add(temp);
							}

							else if (include_range_start == false && include_range_end == true)
							{
								FOV_segment temp = new FOV_segment(FOV_start, f.range_end);
								temp.empty = f.empty;
								temp_seg.add(temp);
							}
						}

					}

					FOV_segment_dataStruct_list_withinFOV.add(new FOV_segment_dataStructure(temp_seg,fsd.radius));

					//Scan from heading to FOV_end second -? clockwise
				}
			}
			else
			{
				//Shadow copy is good enough here
				FOV_segment_dataStruct_list_withinFOV = FOV_segment_dataStruct_list;
			}

			//FIlter to act on empty or unempty segment
			//ArrayList<FOV_segment> filter_FOV_segment_list = new ArrayList<FOV_segment>();

			for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list_withinFOV)
			{
				//Act on unempty segment
				if (act_on_empty_space == 0)
				{
					//Remove empty segment
					fsd.FOV_segment_list.removeIf(n -> n.empty == true);
				}
				//Act on empty segment
				else
				{
					//Remove unempty segment
					fsd.FOV_segment_list.removeIf(n -> n.empty == false);
				}
			}

			within_entrance_sense = true;
			boolean inside_hallway = false;
			//General heading direction range


			//Range list is used to identify desired segment
			//Each entrance should have one desired range segment
			ArrayList<desireDirection> desireDirectionRangeList = new ArrayList<desireDirection>();
			
			//Single list is used to identify desired heading
			//Each entrance should have one desired heading
			ArrayList<desireDirection> desireDirectionSingleList = new ArrayList<desireDirection>();
			
			//Heading now is a range
			if (Main.goals.isEmpty() == false)
			{
				int count = 0;
				for (Goal g : Main.goals)
				{
					
					if (g instanceof Goal_rectangle)
					{
						Goal_rectangle g_r = (Goal_rectangle) g;
						
						//First check if agent is inside a hallway or not
						if (target_agent.getCurrentZone(g_r) != 0)
						{
							/*
							ArrayList<Entity> select_goal_entity = new ArrayList<Entity>();

							select_goal_entity.add(goals.get(0));

							heading = getDirectiontoPosition(target_agent, select_goal_entity);
							
							*/
							inside_hallway = true;
							
							//Hardcode for now.
							if (count == 1)
							{
								return heading = 0;
							}
							else if (count == 3)
							{
								return heading = 180;
							}
						}

					}
					
					count++;
				}
				
				//If agent is not inside any hallway
				//-> Find a set of desired direction
				if (inside_hallway == false)
				{
					for (Goal g : Main.goals)
					{
						//we only care desire direction to entrance, not door
						if (g instanceof Goal_rectangle && g.type.value == 3.1)
						{
							int heading_start = 0;
							int heading_end = 0;
							double limit_FOV_to_see_goal = 1000;
							
							Goal_rectangle hallway_zone = (Goal_rectangle) g;
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
								
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, dis_list.get(0).position);
								heading_start = heading_end;
								
								desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(0).distance));
							}
							else if (dis_list.get(0).distance > limit_FOV_to_see_goal && dis_list.get(1).distance  < limit_FOV_to_see_goal)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, dis_list.get(1).position);
								heading_end = heading_start;
								desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(1).distance));
								
							}
							//This is where both pos1 and pos4 are within limit_FOV_to_see_goal.
							//Desire direction now is a range.
							else if (dis_list.get(0).distance < limit_FOV_to_see_goal && dis_list.get(1).distance < limit_FOV_to_see_goal)
							{
								
								if ( (dis_list.get(0).corner_num == 1 && dis_list.get(1).corner_num == 4) || (dis_list.get(0).corner_num == 4 && dis_list.get(1).corner_num == 1))
								{
									
									heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos4);
									heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos1);
									
									
									if (dis_list.get(0).distance < dis_list.get(1).distance)
									{
										desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(0).distance));
									}
									else
									{
										desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(1).distance));
									}
									
								}
								
								else if ((dis_list.get(0).corner_num == 2 && dis_list.get(1).corner_num == 3) || (dis_list.get(0).corner_num == 3 && dis_list.get(1).corner_num == 2))
								{
									heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos3);
									heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos2);
									
									
									if (dis_list.get(0).distance < dis_list.get(1).distance)
									{
										desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(0).distance));
									}
									else
									{
										desireDirectionRangeList.add(new desireDirection(heading_start, heading_end, dis_list.get(1).distance));
									}
								}
								
									
							}
							else
							{
								within_entrance_sense = false;
								//System.out.println("Not sense the entrance");
							}
							
							/*
							//Use this part if agent can sense entrance goal everywhere
							Goal_rectangle hallway_zone = (Goal_rectangle) goals.get(1);

							heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos1);
							heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos4);
							 */
							
							ArrayList<Entity> select_goal_entity = new ArrayList<Entity>();

							select_goal_entity.add(hallway_zone);
							
							int desired_heading = (int) getDirectiontoPosition(target_agent, select_goal_entity);
							desireDirectionSingleList.add(new desireDirection (desired_heading,desired_heading, dis_list.get(0).distance));
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
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(360,65.5));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(360,35));
								
								Goal_point current_goal = (Goal_point) target_agent.goal_task.get(0);
								current_goal.reach = false;
								heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
								
							}
							else if (z_rec.ID == 1.1)
							{
								Goal_point current_goal;
								double distance = 0;
								
								if (target_agent.goal_task.get(0).reach == false)
								{
									//Inside corner zone but not yet reach the goal
									current_goal = (Goal_point) target_agent.goal_task.get(0);
									
									distance = Math.sqrt(Math.pow(target_agent.position.x - current_goal.position.x, 2) + Math.pow(target_agent.position.y - current_goal.position.y, 2));
									
									//Inside corner zone and reach the goal
									if (distance < current_goal.effect_radius)
									{
										target_agent.goal_task.get(0).reach = true;
										current_goal = (Goal_point) target_agent.goal_task.get(1);
										heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
									}
								}
								else
								{
									//If agent is inside the corner zone and already reach the goal
									//But for some reason, escape the goal effect area 
									// It will head to the next goal, not the goal in this current corner
									current_goal = (Goal_point) target_agent.goal_task.get(1);
									heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
								}
								
								
							}
							else if (z_rec.ID == 2)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(365,160));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(395,160));
								Goal_point current_goal = (Goal_point) target_agent.goal_task.get(1);
								current_goal.reach = false;
								heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
							}
							else if (z_rec.ID == 2.1)
							{
								Goal_point current_goal;
								double distance = 0;
								
								if (target_agent.goal_task.get(1).reach == false)
								{
									//Inside corner zone but not yet reach the goal
									current_goal = (Goal_point) target_agent.goal_task.get(1);
									
									distance = Math.sqrt(Math.pow(target_agent.position.x - current_goal.position.x, 2) + Math.pow(target_agent.position.y - current_goal.position.y, 2));
									
									//Inside corner zone and reach the goal
									if (distance < current_goal.effect_radius)
									{
										target_agent.goal_task.get(1).reach = true;
										current_goal = (Goal_point) target_agent.goal_task.get(2);
										heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
									}
								}
								else
								{
									//If agent is inside the corner zone and already reach the goal
									//But for some reason, escape the goal effect area 
									// It will head to the next goal, not the goal in this current corner
									current_goal = (Goal_point) target_agent.goal_task.get(2);
									heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
								}
							}
							else if (z_rec.ID == 3)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(585,195));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(585,165));
								Goal_point current_goal = (Goal_point) target_agent.goal_task.get(2);
								current_goal.reach = false;
								heading_to = target_agent.position.convertFromPositionToAngle(target_agent.position, current_goal.position);
							}
							
							//System.out.println("Inside the triangle");
							
							heading_to = z_rec.pre_set_heading;
							desireDirectionSingleList.add(new desireDirection (heading_to,heading_to, 0));
							desireDirectionRangeList.add(new desireDirection(heading_start, heading_end,0));
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
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(365,70));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(395,70));
							}
							else if (z_tri.ID == 5)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(365,70));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(395,70));
							}
							else if (z_tri.ID == 6)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,195));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,165));
							}
							else if (z_tri.ID == 7)
							{
								heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,195));
								heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, new Position(400,165));
							}
							
							//System.out.println("Inside the triangle");
							//heading_to = z_tri.pre_set_heading;
							//desireDirectionSingleList.add(new desireDirection (heading_start,heading_end, 0));
							
							desireDirectionSingleList.add(new desireDirection (z_tri.pre_set_heading,z_tri.pre_set_heading, 0));
							desireDirectionRangeList.add(new desireDirection(heading_start, heading_end,0));
						}
					}
				}
				
				
			}
			
			desireDirectionSingleList.add(new desireDirection (0,0, 0));
			
			//FOV_segment list here should contain either all empty or all occupied segment
			//Reduce the segment so that there is no overlap between segments
			//Check the furthest one first since it provides the farthest distance that agents can travel
			Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

			int[] circle_hit_original = new int[360];

			//Circle_hit includes a list of number from 1 - size of FOV_list
			int[] circle_hit = new int[360];

			boolean check_furthest_segment = false;


			int size = FOV_segment_dataStruct_list_withinFOV.size();
			//Reduce the segment so that there is no overlap between segments
			for (FOV_segment_dataStructure fov_seg_struct : FOV_segment_dataStruct_list_withinFOV)
			{

				for (FOV_segment chosen_segment : fov_seg_struct.FOV_segment_list)
				{

					for (int a = 0; a < circle_hit.length; a++)
					{
						
						if (check_furthest_segment == false)
						{
							if (a >= chosen_segment.range_start && a <= chosen_segment.range_end)
							{
								circle_hit[a] = size;
								circle_hit_original[a] = size;
							}
						}
						//This should be chosen after the first loop is done
						else
						{

							if (a > chosen_segment.range_start && a < chosen_segment.range_end && circle_hit[a] == 0)
							{
								circle_hit[a] = size;
								circle_hit_original[a] = size;
							}
						}

					}
				}



				size--;
				check_furthest_segment = true;
			}

			boolean there_is_segment_in_general_heading = false;
			
			for (int a = 0; a < circle_hit.length; a++)
			{
				//For each a angle, we need to check if it is inside any desireDirection set or not.
				boolean inside = false;
				
				for (desireDirection d : desireDirectionRangeList)
				{
				
					if (d.head_start < d.head_end)
					{
						if ((a>= d.head_start && a <= d.head_end))
						{
							//circle_hit[a] = 0;
							inside = true;
							break;
						}

					}
					else
					{
						if ((a>= d.head_start && a <= 359 || a>=0 && a< d.head_end))
						{
							//circle_hit[a] = 0;
							inside = true;
							break;

						}

					}
				}

				//Only when circle_hit[a] angle is not inside any desiredDirectionList
				if (inside == false)
				{
					circle_hit[a] = 0;
				}
			}

			/*
			for (int a = 0; a < circle_hit.length; a++)
			{
				System.out.println(a + " " + circle_hit[a]);

			}
			*/

			for (int a = 0; a < circle_hit.length; a++)
			{
				//System.out.println(a + " " + circle_hit[a]);

				if (circle_hit[a] != 0)
				{

					there_is_segment_in_general_heading = true;
					break;
				}
			}



			Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

			//CHeck if there is at least one segment to work on.
			//This is different from there_is_segment_in_general_heading where that variable check if there is a segment within generaal direction range.
			boolean null_FOV = true;

			for (int a = 0; a < circle_hit_original.length; a++)
			{
				//System.out.println(a + " " + circle_hit[a]);

				if (circle_hit_original[a] != 0)
				{

					null_FOV = false;
					break;
				}
			}

			//original_segment_dataStructure_list contains the segment so that there is no overlap between segments
			//ArrayList<FOV_segment_dataStructure> original_segment_dataStructure_list = convertFromSegmentArrayToArrayList(circle_hit_original, FOV_segment_dataStruct_list_withinFOV);

			ArrayList<FOV_segment_dataStructure> original_segment_dataStructure_list = getSegmentWithoutOverlap(neighbor_entities, obstacles, target_agent);
			//Each number present heading option for each segment from shortest to farthest.

			ArrayList<FOV_segment_dataStructure> reduce_FOV_segment_dataStruct_list = new ArrayList<FOV_segment_dataStructure>();

			//If general heading range is not within any filtered segment
			//This reduce_FOV_segment is empty
			if (there_is_segment_in_general_heading == false || within_entrance_sense == false) 
			{
				reduce_FOV_segment_dataStruct_list.clear();
			}
			//If general heading range is within a filtered segment -> this reduce_FOV_dataStruture contain only the information of
			//the filtered segments within the range.
			else
			{
			
				reduce_FOV_segment_dataStruct_list = convertFromSegmentArrayToArrayList(circle_hit, FOV_segment_dataStruct_list_withinFOV);
			
			}


			/*
			System.out.println("----------------------------");

			for (Heading_Distance hd : decision_option)
			{

				System.out.println("Heading: " + hd.heading + " Distance: " + hd.distance + " Remove: " + hd.remove);	
			}
			 */

			//There is at least one segment to work on
			if (null_FOV == false)
			{
				
				reference_value = getHeadingFromSegmentList(desireDirectionSingleList, heading_original, act_on_space_property, heading_option_combination, target_agent, neighbor_entities, original_segment_dataStructure_list, reduce_FOV_segment_dataStruct_list, for_action);

				//These two option return a value of angle
				//Need to check the bound, for other property, no need for that.
				if (act_on_space_property == 1 || act_on_space_property == 2)
				{
					if (reference_value < 0)
					{
						reference_value = 360 + reference_value;
					}
					else if (reference_value > 360)
					{
						reference_value = reference_value - 360;
					}
				}
			
			

				return reference_value;	
			}
			else
			{
				return heading_original;
			}
		}

		return 0;
	}

	
	public ArrayList<FOV_segment_dataStructure> getSegmentWithoutOverlap(ArrayList<Entity> neighbor_entities, ArrayList<Obstacle> obstacles, Agent target_agent)
	{

		double heading_original = target_agent.heading.value;
		double heading = target_agent.heading.value;
		//heading += current_behavior.offset;

		ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = target_agent.fov.getEntityWithAdaptiveFOV(neighbor_entities, obstacles, target_agent, 0);

		//Apply FOV start and FOV end here
		int view_angle = target_agent.fov.view_angle;

		int FOV_start = (int) (target_agent.heading.value - view_angle/2);
		int FOV_end = (int) (target_agent.heading.value + view_angle/2);

		if (FOV_start < 0)
		{
			FOV_start = 360 + FOV_start;
		}

		if (FOV_end >= 360)
		{
			FOV_end = FOV_end - 360;
		}

		ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list_withinFOV = new ArrayList<FOV_segment_dataStructure>();

		if (Main.global_var.fov_angle != 360)
		{
			for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list)
			{

				ArrayList<FOV_segment> temp_seg = new ArrayList<FOV_segment>();

				for (FOV_segment f : fsd.FOV_segment_list)
				{
					//Scan from heading to FOV_start first -> counter clockwise
					int scan_value= FOV_start;
					boolean include_range_start = false;
					boolean include_range_end = false;
					boolean reverse_case = false;

					while (scan_value != FOV_end)
					{

						if (f.range_start == scan_value)
						{
							include_range_start = true;

						}

						if (f.range_end == scan_value)
						{
							include_range_end = true;
							//Meaning for this segment, the scan value hits the range_end before range_start

							if (include_range_start == false)
							{
								reverse_case = true;
								FOV_segment temp_end_segment = new FOV_segment(FOV_start, f.range_end);
								temp_end_segment.empty = f.empty;

								temp_seg.add(temp_end_segment);
								//At the moment the reverse case is true,
								//We work all the way to the check for f.range_start here as well, 
								//Then we break the loop.
								while(scan_value != FOV_end)
								{

									if (f.range_start == scan_value)
									{
										FOV_segment temp_start_segment = new FOV_segment(f.range_start, FOV_end);
										temp_start_segment.empty = f.empty;

										temp_seg.add(temp_start_segment);
										break;
									}

									if (scan_value == 359)
									{
										scan_value = -1;
									}

									scan_value++;
								}
								break;
							}
						}

						if (scan_value == 359)
						{
							scan_value = -1;
						}

						scan_value++;
					}

					if (reverse_case == false)
					{
						if (include_range_start == true && include_range_end == true)
						{
							temp_seg.add(f);
						}

						else if (include_range_start == true && include_range_end == false)
						{
							FOV_segment temp = new FOV_segment(f.range_start, FOV_end);
							temp.empty = f.empty;

							temp_seg.add(temp);
						}

						else if (include_range_start == false && include_range_end == true)
						{
							FOV_segment temp = new FOV_segment(FOV_start, f.range_end);
							temp.empty = f.empty;
							temp_seg.add(temp);
						}
					}

				}

				FOV_segment_dataStruct_list_withinFOV.add(new FOV_segment_dataStructure(temp_seg,fsd.radius));

				//Scan from heading to FOV_end second -? clockwise
			}
		}
		else
		{
			//Shadow copy is good enough here
			FOV_segment_dataStruct_list_withinFOV = FOV_segment_dataStruct_list;
		}

		//FIlter to act on empty or unempty segment
		//ArrayList<FOV_segment> filter_FOV_segment_list = new ArrayList<FOV_segment>();

		for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list_withinFOV)
		{
			//Act on unempty segment
			if (act_on_empty_space == 0)
			{
				//Remove empty segment
				fsd.FOV_segment_list.removeIf(n -> n.empty == true);
			}
			//Act on empty segment
			else
			{
				//Remove unempty segment
				fsd.FOV_segment_list.removeIf(n -> n.empty == false);
			}
		}

		within_entrance_sense = true;
		boolean inside_hallway = false;
		//General heading direction range


		//Range list is used to identify desired segment
		//Each entrance should have one desired range segment
		ArrayList<desireDirection> desireDirectionRangeList = new ArrayList<desireDirection>();

		//Single list is used to identify desired heading
		//Each entrance should have one desired heading
		ArrayList<desireDirection> desireDirectionSingleList = new ArrayList<desireDirection>();


		//FOV_segment list here should contain either all empty or all occupied segment
		//Reduce the segment so that there is no overlap between segments
		//Check the furthest one first since it provides the farthest distance that agents can travel
		Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

		int[] circle_hit_original = new int[360];

		//Circle_hit includes a list of number from 1 - size of FOV_list
		int[] circle_hit = new int[360];

		boolean check_furthest_segment = false;


		int size = FOV_segment_dataStruct_list_withinFOV.size();
		//Reduce the segment so that there is no overlap between segments
		for (FOV_segment_dataStructure fov_seg_struct : FOV_segment_dataStruct_list_withinFOV)
		{

			for (FOV_segment chosen_segment : fov_seg_struct.FOV_segment_list)
			{

				for (int a = 0; a < circle_hit.length; a++)
				{

					if (check_furthest_segment == false)
					{
						if (a >= chosen_segment.range_start && a <= chosen_segment.range_end)
						{
							circle_hit[a] = size;
							circle_hit_original[a] = size;
						}
					}
					//This should be chosen after the first loop is done
					else
					{

						if (a > chosen_segment.range_start && a < chosen_segment.range_end && circle_hit[a] == 0)
						{
							circle_hit[a] = size;
							circle_hit_original[a] = size;
						}
					}

				}
			}



			size--;
			check_furthest_segment = true;
		}

		boolean there_is_segment_in_general_heading = false;

		for (int a = 0; a < circle_hit.length; a++)
		{
			//For each a angle, we need to check if it is inside any desireDirection set or not.
			boolean inside = false;

			for (desireDirection d : desireDirectionRangeList)
			{

				if (d.head_start < d.head_end)
				{
					if ((a>= d.head_start && a <= d.head_end))
					{
						//circle_hit[a] = 0;
						inside = true;
						break;
					}

				}
				else
				{
					if ((a>= d.head_start && a <= 359 || a>=0 && a< d.head_end))
					{
						//circle_hit[a] = 0;
						inside = true;
						break;

					}

				}
			}

			//Only when circle_hit[a] angle is not inside any desiredDirectionList
			if (inside == false)
			{
				circle_hit[a] = 0;
			}
		}

		/*
			for (int a = 0; a < circle_hit.length; a++)
			{
				System.out.println(a + " " + circle_hit[a]);

			}
		 */

		for (int a = 0; a < circle_hit.length; a++)
		{
			//System.out.println(a + " " + circle_hit[a]);

			if (circle_hit[a] != 0)
			{

				there_is_segment_in_general_heading = true;
				break;
			}
		}



		Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

		//CHeck if there is at least one segment to work on.
		//This is different from there_is_segment_in_general_heading where that variable check if there is a segment within generaal direction range.
		boolean null_FOV = true;

		for (int a = 0; a < circle_hit_original.length; a++)
		{
			//System.out.println(a + " " + circle_hit[a]);

			if (circle_hit_original[a] != 0)
			{

				null_FOV = false;
				break;
			}
		}

		//original_segment_dataStructure_list contains the segment so that there is no overlap between segments
		ArrayList<FOV_segment_dataStructure> original_segment_dataStructure_list = convertFromSegmentArrayToArrayList(circle_hit_original, FOV_segment_dataStruct_list_withinFOV);


		return original_segment_dataStructure_list;
	}

	
	//Original segment list contain all information of all chosen segments.
	//Reduce segment list contains only information of the segments that have general direction range within. 
	public double getHeadingFromSegmentList(ArrayList<desireDirection> desireDirectionSingleList,double heading_original, double act_on_space_property2, int relative_distance_option, Agent target_agent, ArrayList<Entity> neighbor_entities, ArrayList<FOV_segment_dataStructure> original_segment_list, ArrayList<FOV_segment_dataStructure> reduce_segment_list, boolean for_action)
	{
		Random rand = new Random();
		double heading = heading_original;

		//This decision option store all information that one space heading entity option can have
		//Including: heading value, travel distance, and angle distance to a reference angle
		ArrayList<SpaceHeadingEntity> decision_option = new ArrayList<SpaceHeadingEntity>();
		SpaceHeadingEntity dummy_heading_distance = new SpaceHeadingEntity(0,0,0,0,0,0,0);

		double sum_score = 0;

		for (FOV_segment_dataStructure fov_seg_struct : original_segment_list)
		{
			for (FOV_segment chosen_segment : fov_seg_struct.FOV_segment_list)
			{
				ArrayList<Integer> heading_temp = chosen_segment.headingDirectionOptions(chosen_segment);

				if (chosen_segment.range_end == chosen_segment.range_start)
				{
					heading_temp.clear();
					heading_temp.add(chosen_segment.range_end);
				
				}
				
				desireDirection min_distance_to_goal_instance = new desireDirection(0,0,0);
						
				for (int i: heading_temp)
				{
					//If there are more than one entrance
					// -> we need to find desired angle distance to all of them
					// And choose the minimum distance.
					int minDistance_to_desired_direction = Integer.MAX_VALUE;
					int distance_angle_to_desire_direction = 0;
					
					for (desireDirection d: desireDirectionSingleList)
					{
						//Distance angle is between desired direction and heading option (i in this case)
						
						//head start or head end should have the same value here
						distance_angle_to_desire_direction = dummy_heading_distance.getdistanceAngle(d.head_start, i);
						
						if (distance_angle_to_desire_direction < minDistance_to_desired_direction)
						{
							minDistance_to_desired_direction = distance_angle_to_desire_direction;
							min_distance_to_goal_instance = d;
						}
					}
					
					//
					
					int distance_angle_to_current_direction = dummy_heading_distance.getdistanceAngle(heading_original, i);
					
					//This filter is hard-code to get agents within [-5,5] of a heading (i in this case)
					ArrayList<Filter> filter_chain = new ArrayList<Filter>();
					filter_chain.add(new Filter_ranged(2.1,-10,10,0));
					Agent dummy_agent = new Agent(target_agent.position, i, 0, 1.0);
					
					ArrayList<Entity> return_neighbor = Main.utility.getFilteredAgents(filter_chain, dummy_agent, neighbor_entities, i);
					
					int density = return_neighbor.size();
					for (Entity e : return_neighbor)
					{
						if (e instanceof Obstacle_circle)
						{
							density += 5;
						}
						else if (e instanceof Obstacle_rectangle)
						{
							density += 10;
							break;
						}
					}
					
					
					//Calculate predict_distance_travel_to_nearest_desire_goal here
					//Travel distance is fov_seg_struct.radius
					Agent predict_agent = new Agent();
					//double next_X = Math.cos(Math.toRadians(angle)) * speed;
					predict_agent.position = new Position(target_agent.position.x + fov_seg_struct.radius*Math.cos(Math.toRadians(i)), target_agent.position.y - fov_seg_struct.radius*Math.sin(Math.toRadians(i)));
					
					//predict_agent.position = new Position(10 + 10*Math.cos(89*Math.PI/180), 10 + 10*Math.sin(89*Math.PI/180));
					
					//Find the distance to all entrance and assign the minimum one predict_distance_travel_to_nearest_desire_goal
					//dis_list contain distances to all entrance for the predict_agent
					ArrayList<positionDistance> predict_dis_list = new ArrayList<positionDistance>();
					
					if (Main.goals.isEmpty() == false)
					{
						for (Goal g : Main.goals)
						{
							
							//we only care desire direction to entrance, not door
							if (g instanceof Goal_rectangle && g.type.value == 3.1)
							{
								
								Goal_rectangle hallway_zone = (Goal_rectangle) g;
								
								
								//SortbyDistancetoEntrance
								double dis_to_pos1 = Math.sqrt(Math.pow(predict_agent.position.x - hallway_zone.zone_goal.pos1.x, 2) + Math.pow(predict_agent.position.y - hallway_zone.zone_goal.pos1.y, 2));
								predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos1, dis_to_pos1,1));
								double dis_to_pos2 = Math.sqrt(Math.pow(predict_agent.position.x - hallway_zone.zone_goal.pos2.x, 2) + Math.pow(predict_agent.position.y - hallway_zone.zone_goal.pos2.y, 2));
								predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos2, dis_to_pos2,2));
								double dis_to_pos3 = Math.sqrt(Math.pow(predict_agent.position.x - hallway_zone.zone_goal.pos3.x, 2) + Math.pow(predict_agent.position.y - hallway_zone.zone_goal.pos3.y, 2));
								predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos3, dis_to_pos3,3));
								double dis_to_pos4 = Math.sqrt(Math.pow(predict_agent.position.x - hallway_zone.zone_goal.pos4.x, 2) + Math.pow(predict_agent.position.y - hallway_zone.zone_goal.pos4.y, 2));
								predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos4, dis_to_pos4,4));
								
								
								Collections.sort(predict_dis_list, new SortbyDistancetoEntrance());
								
								decision_option.add(new SpaceHeadingEntity(fov_seg_struct.radius,i,minDistance_to_desired_direction, distance_angle_to_current_direction, density, min_distance_to_goal_instance.distance_to_goal, predict_dis_list.get(0).distance));
	
							}
						}
						
						
					}

					decision_option.add(new SpaceHeadingEntity(fov_seg_struct.radius,i,minDistance_to_desired_direction, distance_angle_to_current_direction, density, min_distance_to_goal_instance.distance_to_goal, 0));

				}

			}
		}

		//For all heading within general heading range 
		for (FOV_segment_dataStructure fov_seg_struct : reduce_segment_list)
		{
			for (FOV_segment chosen_segment : fov_seg_struct.FOV_segment_list)
			{
				ArrayList<Integer> heading_temp = chosen_segment.headingDirectionOptions(chosen_segment);
				
				if (chosen_segment.range_end == chosen_segment.range_start)
				{
					heading_temp.clear();
					heading_temp.add(chosen_segment.range_end);
				
				}
				
				desireDirection min_distance_to_goal_instance = new desireDirection(0,0,0);
				//-> They all share the highest score for heading to desired direction category.
				for (int i: heading_temp)
				{
					
					//If there are more than one entrance
					// -> we need to find desired angle distance to all of them
					// And choose the minimum distance.
					int minDistance_to_desired_direction = Integer.MAX_VALUE;
					int distance_angle_to_desire_direction = 0;
					
					for (desireDirection d: desireDirectionSingleList)
					{
						//Distance angle is between desired direction and heading option (i in this case)
						
						//head start or head end should have the same value here
						distance_angle_to_desire_direction = dummy_heading_distance.getdistanceAngle(d.head_start, i);
						
						if (distance_angle_to_desire_direction < minDistance_to_desired_direction)
						{
							minDistance_to_desired_direction = distance_angle_to_desire_direction;
							min_distance_to_goal_instance = d;
						}
					}
					
					int distance_angle_to_current_direction = dummy_heading_distance.getdistanceAngle(heading_original, i);
					
					//This filter is hard-code to get agents within [-5,5] of a heading (i in this case)
					ArrayList<Filter> filter_chain = new ArrayList<Filter>();
					filter_chain.add(new Filter_ranged(2.1,-10,10,0));
					Agent dummy_agent = new Agent(target_agent.position, i, 0, 1.0);
					
					ArrayList<Entity> return_neighbor = Main.utility.getFilteredAgents(filter_chain, dummy_agent, neighbor_entities, i);
					
					int density = return_neighbor.size();
					
					
					/*
					//Calculate predict_distance_travel_to_nearest_desire_goal here
					//Travel distance is fov_seg_struct.radius
					Agent predict_agent = new Agent();
					predict_agent.position = new Position(target_agent.position.x + fov_seg_struct.radius*Math.cos(Math.toRadians(i)), target_agent.position.y - fov_seg_struct.radius*Math.sin(Math.toRadians(i)));
					
					//predict_agent.position = new Position(10 + 10*Math.cos(89*Math.PI/180), 10 + 10*Math.sin(89*Math.PI/180));
					
					//Find the distance to all entrance and assign the minimum one predict_distance_travel_to_nearest_desire_goal
					//dis_list contain distances to all entrance for the predict_agent
					ArrayList<positionDistance> predict_dis_list = new ArrayList<positionDistance>();
					for (Goal g : Main.goals)
					{
						
						//we only care desire direction to entrance, not door
						if (g instanceof Goal_rectangle && g.type.value == 3.1)
						{
							
							Goal_rectangle hallway_zone = (Goal_rectangle) g;
							
							
							//SortbyDistancetoEntrance
							double dis_to_pos1 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos1.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos1.y, 2));
							predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos1, dis_to_pos1,1));
							double dis_to_pos2 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos2.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos2.y, 2));
							predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos2, dis_to_pos2,2));
							double dis_to_pos3 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos3.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos3.y, 2));
							predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos3, dis_to_pos3,3));
							double dis_to_pos4 = Math.sqrt(Math.pow(target_agent.position.x - hallway_zone.zone_goal.pos4.x, 2) + Math.pow(target_agent.position.y - hallway_zone.zone_goal.pos4.y, 2));
							predict_dis_list.add(new positionDistance(hallway_zone.zone_goal.pos4, dis_to_pos4,4));
							

						}
					}
					
					Collections.sort(predict_dis_list, new SortbyDistancetoEntrance());
					*/
					
					//-> They all share the highest score for heading to desired direction category.
					SpaceHeadingEntity hd = new SpaceHeadingEntity(fov_seg_struct.radius, i, 0, distance_angle_to_current_direction, density,min_distance_to_goal_instance.distance_to_goal,0);
					hd.within_general_direction_range = true;
					decision_option.add(hd);
				}

			}
		}

		

		//Filter out unwanted space heading entity
		for (Filter f: filter_chain)
		{
			if (f instanceof Filter_ranged)
			{
				Filter_ranged f_r = (Filter_ranged) f;
				//Filter desired direction
				if (f.filtered_p == 1)
				{
					decision_option.removeIf(n -> n.distance_angle_to_desire_direction < f_r.lowerRange || n.distance_angle_to_desire_direction > f_r.upperRange);
				}
				//Filter travel distance
				else if (f.filtered_p == 2)
				{
					decision_option.removeIf(n -> n.distance_travel < f_r.lowerRange || n.distance_travel > f_r.upperRange);
				}
				//Filter current distance
				else if (f.filtered_p == 3)
				{
					decision_option.removeIf(n -> n.distance_angle_to_current_direction < f_r.lowerRange || n.distance_angle_to_current_direction > f_r.upperRange);
				}
				//Filter current distance
				else if (f.filtered_p == 4)
				{
					decision_option.removeIf(n -> n.entity_density < f_r.lowerRange || n.entity_density > f_r.upperRange);
				}
			}
		}
		
		if (decision_option.size() == 0)
		{
			if (for_action == false)
			{
				return Double.NaN;
			}
			else
			{
				return heading_original;
			}
			
		}
		//0. Compare option to desired direction
		if (act_on_space_property2== 1)
		{			

			if (within_entrance_sense == false)
			{
				return heading_original;
			}
			ArrayList<SpaceHeadingEntity> decision_option_for_desired_heading_equal0 = new ArrayList<SpaceHeadingEntity>();
			
			Collections.sort(decision_option, new SortbyDistance_Angle_to_Desired_Direction());

			//nearest to desired direction
			if (relative_distance_option == 1)
			{
				for(SpaceHeadingEntity hd : decision_option)
				{
					if (hd.distance_angle_to_desire_direction == 0)
					{
						decision_option_for_desired_heading_equal0.add(hd);
					}
				}

				//If there is more than 1 option within general heading direction
				//Randomly choose one of the options
				if (decision_option_for_desired_heading_equal0.size() != 0)
				{
					//If there are more than one option with distance to desired direction = 0
					//Choose the one that nearest to the current heading direction
					Collections.sort(decision_option_for_desired_heading_equal0, new SortbyTravelDistanceToGoalWithinARange());
					
					double min_distance = decision_option_for_desired_heading_equal0.get(0).distance_travel_to_desire_goal;
					
					decision_option_for_desired_heading_equal0.removeIf(n -> n.distance_travel_to_desire_goal > min_distance);
					
					//heading = decision_option_for_desired_heading_equal0.get(0).heading;
					
					//Getting a random one
					heading = decision_option_for_desired_heading_equal0.get(rand.nextInt(decision_option_for_desired_heading_equal0.size())).heading;
					
					//Withing general direction
					//Distance angle to desired direction is always 0
					if (for_action == false)
					{
						return 0;
					}
				}
				//If there is no option within general heading direction
				//Simply choose between top 2
				else
				{
					if (decision_option.size() >= 2)
					{
						int chosing_index = rand.nextInt(2);

						//chosing_index = 0;
						
						heading = decision_option.get(chosing_index).heading;
						
						if (for_action == false)
						{
							return decision_option.get(chosing_index).distance_angle_to_desire_direction;
						}
					}
					else
					{
						heading = decision_option.get(0).heading;
						
						if (for_action == false)
						{
							return decision_option.get(0).distance_angle_to_desire_direction;
						}
					}

				}
			}
			//farthest to desired direction
			//Simply choose between the last 2
			else if (relative_distance_option == 2)
			{
				if (decision_option.size() >= 2)
				{
					int chosing_index = decision_option.size() - rand.nextInt(2) - 1;
					heading = decision_option.get(chosing_index).heading;
					
					if (for_action == false)
					{
						return decision_option.get(chosing_index).distance_angle_to_desire_direction;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).distance_angle_to_desire_direction;
					}
				}
			}

			

		}
		//2. Compare travel distance
		//If there is more than 1 farthest segment to choose from
		//This option 2 will always pick the one with nearest heading compare to desired direction
		else if (act_on_space_property2== 2)
		{
			Collections.sort(decision_option, new SortbyDistance_Travel());
			
			//Travel to farthest
			if (relative_distance_option == 1)
			{
				double farthest_distance = decision_option.get(0).distance_travel;
				decision_option.removeIf(n -> n.distance_travel != farthest_distance);

				if (decision_option.size() >= 2)
				{
					//If agent cannot sense entrance and there are more than one option to travel farthest
					//Agent will pick a random one
					if (within_entrance_sense == false)
					{
						
						heading = decision_option.get(rand.nextInt(decision_option.size())).heading;
						return heading;
					}
					else
					{
						Collections.sort(decision_option, new SortbyDistance_Angle_to_Desired_Direction());

						int chosing_index = rand.nextInt(2);

						heading = decision_option.get(chosing_index).heading;
						
						if (for_action == false)
						{
							return decision_option.get(chosing_index).distance_travel;
						}
					}
					
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).distance_travel;
					}
				}

			}
			//Travel to shortest
			else if (relative_distance_option == 2)
			{

				double shortest_distance = decision_option.get(decision_option.size() - 1).distance_travel;

				decision_option.removeIf(n -> n.distance_travel != shortest_distance);

				if (decision_option.size() >= 2)
				{
					//If agent cannot sense entrance and there are more than one option to travel shortest
					//Agent will pick a random one
					if (within_entrance_sense == false)
					{
						heading = decision_option.get(0).heading;
						return heading;
					}
					else
					{
						Collections.sort(decision_option, new SortbyDistance_Angle_to_Desired_Direction());

						int chosing_index = rand.nextInt(2);

						heading = decision_option.get(0).heading;

						if (for_action == false)
						{
							return decision_option.get(chosing_index).distance_travel;
						}
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).distance_travel;
					}
				}

			}




		}
		//3. Compare option to current direction.
		else if (act_on_space_property2== 3)
		{
			Collections.sort(decision_option, new SortbyDistance_Angle_to_Current_Direction());

			//Choose nearest
			if (relative_distance_option == 1)
			{
				if (decision_option.size() >= 2)
				{

					int chosing_index = rand.nextInt(2);

					heading = decision_option.get(chosing_index).heading;
					

					if (for_action == false)
					{
						return decision_option.get(chosing_index).distance_angle_to_current_direction;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).distance_angle_to_current_direction;
					}
				}

			}
			//Choose farthest
			else if (relative_distance_option == 2)
			{

				if (decision_option.size() >= 2)
				{

					int chosing_index = decision_option.size() - rand.nextInt(2) - 1;

					heading = decision_option.get(chosing_index).heading;
					
					if (for_action == false)
					{
						return decision_option.get(chosing_index).distance_angle_to_current_direction;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).distance_angle_to_current_direction;
					}
				}

			}
			
			/*
				System.out.println("Desired direction: " + desired_heading);
				System.out.println("Current direction: " + heading_original);
				for (Heading_Distance hd : decision_option)
				{
					System.out.println("---------------");
					System.out.println("Heading: " + hd.heading);
					System.out.println("Travel distance: " + hd.distance_travel);
					System.out.println("Angle distance to disired direction: " + hd.distance_angle_to_desire_direction);
					System.out.println("Angle distance to current direction: " + hd.distance_angle_to_current_direction);
				}


				System.out.println("FInal heading: " + heading);

				System.out.println();
			 */
		}
		//4. Compare option to density
		else if (act_on_space_property2== 4)
		{
			Collections.sort(decision_option, new SortbyDensityWithinARange());

			//Choose least dense
			if (relative_distance_option == 1)
			{
				if (decision_option.size() >= 2)
				{

					int chosing_index = rand.nextInt(2);

					heading = decision_option.get(chosing_index).heading;
					

					if (for_action == false)
					{
						return decision_option.get(chosing_index).entity_density;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).entity_density;
					}
				}

			}
			//Choose most dense
			else if (relative_distance_option == 2)
			{

				if (decision_option.size() >= 2)
				{

					int chosing_index = decision_option.size() - rand.nextInt(2) - 1;

					heading = decision_option.get(chosing_index).heading;
					
					if (for_action == false)
					{
						return decision_option.get(chosing_index).entity_density;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).entity_density;
					}
				}
			}
		}
		//5. Compare option to distance to the entrance
		else if (act_on_space_property2== 5)
		{
			Collections.sort(decision_option, new SortbyPredictDistanceToEntrance());

			//Choose option the make predict agent move closer to the nearest entrance
			if (relative_distance_option == 1)
			{
				if (decision_option.size() >= 2)
				{

					int chosing_index = rand.nextInt(2);

					heading = decision_option.get(chosing_index).heading;
					

					if (for_action == false)
					{
						return decision_option.get(chosing_index).predict_distance_travel_to_nearest_desire_goal;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).predict_distance_travel_to_nearest_desire_goal;
					}
				}

			}
			////Choose option the make predict agent move closer to the farthest entrance
			else if (relative_distance_option == 2)
			{

				if (decision_option.size() >= 2)
				{

					int chosing_index = decision_option.size() - rand.nextInt(2) - 1;

					heading = decision_option.get(chosing_index).heading;
					
					if (for_action == false)
					{
						return decision_option.get(chosing_index).predict_distance_travel_to_nearest_desire_goal;
					}
				}
				else
				{
					heading = decision_option.get(0).heading;
					
					if (for_action == false)
					{
						return decision_option.get(0).predict_distance_travel_to_nearest_desire_goal;
					}
				}
			}
		}
		
		return heading;
	}

	public double getDirectiontoPosition(Agent target_agent, ArrayList<Entity> neighbor_entities)
	{
		double temp_x = 0;
		double temp_y = 0;
		int size = 0;

		ArrayList<Double> angle_convert = new ArrayList<Double>();

		for (Entity e : neighbor_entities)
		{

			if (e instanceof Agent)
			{
				Agent ne = (Agent) e;
				temp_x += ne.position.x;
				temp_y += ne.position.y;

				Position temp_position = ne.position;

				if (e.warp == true)
				{
					temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
				}

				angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, temp_position));
			}
			else if (e instanceof Obstacle)
			{
				if (e instanceof Obstacle_rectangle)
				{
					//What does it mean to extract position of a rectangle position
					//For now it means nothing changed

				}
				else if (e instanceof Obstacle_circle)
				{
					//Not care for now
				}

			}
			else if (e instanceof Goal)
			{
				if (e instanceof Goal_point)
				{
					Goal_point ng = (Goal_point) e;
					temp_x += ng.position.x;
					temp_y += ng.position.y;
					angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.position));
				}
				else if (e instanceof Goal_rectangle)
				{
					//Will get the position so that the turn angle to the goal is shortest
					Goal_rectangle ng = (Goal_rectangle) e;

					//System.out.println("Get reference from zone: " + ng.type.value);

					//8 cases
					//4 CONNER CASES
					//TOP LEFT
					if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y < ng.zone_goal.pos1.y)
					{
						//Heading to pos 1

						angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos1));
						//System.out.println(target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos1));

					}
					//TOP RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y < ng.zone_goal.pos1.y)
					{
						//Heading to pos 2
						temp_x += ng.zone_goal.pos2.x;
						temp_y += ng.zone_goal.pos2.y;
						angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos2));
						//System.out.println(target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos2));
					}
					//BOTTOM RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x && target_agent.position.y > ng.zone_goal.pos3.y)
					{
						//Heading to pos 3
						temp_x += ng.zone_goal.pos3.x;
						temp_y += ng.zone_goal.pos3.y;
						angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos3));
						//System.out.println(target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos3));
					}
					//BOTTOM LEFT
					else if (target_agent.position.x < ng.zone_goal.pos1.x && target_agent.position.y > ng.zone_goal.pos4.y)
					{
						//Heading to pos 4
						temp_x += ng.zone_goal.pos4.x;
						temp_y += ng.zone_goal.pos4.y;
						angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos4));
						//System.out.println(target_agent.position.convertFromPositionToAngle(target_agent.position, ng.zone_goal.pos4));
					}
					//4 SIDE CASES
					//TOP
					else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
							&& target_agent.position.y < ng.zone_goal.pos1.y)
					{
						angle_convert.add(270.0);
						//return 270;
						//System.out.println("270");

					}
					//BOTTOM
					else if (target_agent.position.x > ng.zone_goal.pos1.x && target_agent.position.x < ng.zone_goal.pos2.x
							&& target_agent.position.y > ng.zone_goal.pos3.y)
					{
						angle_convert.add(90.0);
						//return 90;

						//System.out.println("90");
					}
					//LEFT
					else if (target_agent.position.x < ng.zone_goal.pos1.x &&
							target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
					{
						angle_convert.add(0.0);
						//return 0;

						//System.out.println("0");
					}
					//RIGHT
					else if (target_agent.position.x > ng.zone_goal.pos2.x &&
							target_agent.position.y > ng.zone_goal.pos1.y && target_agent.position.y < ng.zone_goal.pos4.y)
					{
						angle_convert.add(180.0);
						//return 180;

						//System.out.println("180");
					}
					else
					{
						double t_x = (ng.zone_goal.pos2.x + ng.zone_goal.pos1.x)/2;
						double t_y = (ng.zone_goal.pos4.y + ng.zone_goal.pos1.x)/2;

						Position temp = new Position(t_x, t_y);

						//angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, temp));

						//Agent is inside the goal zone
						//Keep the same heading direction
						angle_convert.add((double)target_agent.heading.value);
						//return target_agent.heading.value;

						//System.out.println(target_agent.heading.value);
					}

				}

			}

		}

		if (angle_convert.size() > 0)
		{
			double sumSin = 0;
			double sumCos = 0;

			for (Double heading : angle_convert)
			{

				heading *= Math.PI/180;
				sumSin += Math.sin(heading);
				sumCos += Math.cos(heading);
			}


			double next_headingInRad = Math.atan2(sumSin, sumCos);

			reference_value = (int) (next_headingInRad*180/Math.PI);

			if (reference_value < 0)
			{
				reference_value += 360;
			}

		}
		else
		{
			reference_value = target_agent.heading.value;
		}


		return reference_value;

	}

	public ArrayList<FOV_segment_dataStructure> convertFromSegmentArrayToArrayList(int[] circle_hit, ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list_withinFOV)
	{
		ArrayList<FOV_segment_dataStructure> return_array_list = new ArrayList<FOV_segment_dataStructure>();

		for (int a = 1; a <= FOV_segment_dataStruct_list_withinFOV.size(); a++)
		{
			ArrayList<FOV_segment> temp_seg = new ArrayList<FOV_segment>();

			for(int b = 0; b < circle_hit.length; b++)
			{
				int start_range = -1;
				int end_range = -1;

				if (circle_hit[b] == a)
				{
					start_range = b;

					while(circle_hit[b] == a)
					{

						if (b == circle_hit.length-1)
						{
							b++;
							break;
						}

						if (circle_hit[b+1] == a)
						{
							b++;
						}
						else
						{
							break;
						}


					}

					end_range = b;
				}

				if (start_range != -1 && end_range != -1)
				{
					FOV_segment temp = new FOV_segment(start_range, end_range);
					temp.empty = true;

					temp_seg.add(temp);
				}


			}

			//reduce_FOV_segment_dataStruct_list contains non-overlap segment for all radius
			//if somehow one radius is completed overlap by another one, it will appear as none
			//if there is a filtered segment within general direction range
			//this reduce_FOV_segment contain only that filtered segment.
			return_array_list.add(new FOV_segment_dataStructure(temp_seg,FOV_segment_dataStruct_list_withinFOV.get(a-1).radius));
		}

		return return_array_list;
	}
	
	
	//For drawing purposed only
	public ArrayList<FOV_segment_dataStructure> getProcessFOV_segment(ArrayList<Entity> neighbor_entities, ArrayList<Obstacle> obstacles, ArrayList<Goal> goals, Agent target_agent)
	{
		//Angle behavior
		if(extract_property == 1 || extract_property == 2.0 || extract_property == 2.1)
		{
			double heading_original = target_agent.heading.value;
			double heading = target_agent.heading.value;
			//heading += current_behavior.offset;

			ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list = target_agent.fov.getEntityWithAdaptiveFOV(neighbor_entities, obstacles, target_agent, 0);

			//Apply FOV start and FOV end here
			int view_angle = target_agent.fov.view_angle;

			int FOV_start = (int) (target_agent.heading.value - view_angle/2);
			int FOV_end = (int) (target_agent.heading.value + view_angle/2);

			if (FOV_start < 0)
			{
				FOV_start = 360 + FOV_start;
			}

			if (FOV_end >= 360)
			{
				FOV_end = FOV_end - 360;
			}

			ArrayList<FOV_segment_dataStructure> FOV_segment_dataStruct_list_withinFOV = new ArrayList<FOV_segment_dataStructure>();

			if (Main.global_var.fov_angle != 360)
			{
				for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list)
				{

					ArrayList<FOV_segment> temp_seg = new ArrayList<FOV_segment>();

					for (FOV_segment f : fsd.FOV_segment_list)
					{
						//Scan from heading to FOV_start first -> counter clockwise
						int scan_value= FOV_start;
						boolean include_range_start = false;
						boolean include_range_end = false;
						boolean reverse_case = false;

						while (scan_value != FOV_end)
						{

							if (f.range_start == scan_value)
							{
								include_range_start = true;

							}

							if (f.range_end == scan_value)
							{
								include_range_end = true;
								//Meaning for this segment, the scan value hits the range_end before range_start

								if (include_range_start == false)
								{
									reverse_case = true;
									FOV_segment temp_end_segment = new FOV_segment(FOV_start, f.range_end);
									temp_end_segment.empty = f.empty;

									temp_seg.add(temp_end_segment);
									//At the moment the reverse case is true,
									//We work all the way to the check for f.range_start here as well, 
									//Then we break the loop.
									while(scan_value != FOV_end)
									{

										if (f.range_start == scan_value)
										{
											FOV_segment temp_start_segment = new FOV_segment(f.range_start, FOV_end);
											temp_start_segment.empty = f.empty;

											temp_seg.add(temp_start_segment);
											break;
										}

										if (scan_value == 359)
										{
											scan_value = -1;
										}

										scan_value++;
									}
									break;
								}
							}

							if (scan_value == 359)
							{
								scan_value = -1;
							}

							scan_value++;
						}

						if (reverse_case == false)
						{
							if (include_range_start == true && include_range_end == true)
							{
								temp_seg.add(f);
							}

							else if (include_range_start == true && include_range_end == false)
							{
								FOV_segment temp = new FOV_segment(f.range_start, FOV_end);
								temp.empty = f.empty;

								temp_seg.add(temp);
							}

							else if (include_range_start == false && include_range_end == true)
							{
								FOV_segment temp = new FOV_segment(FOV_start, f.range_end);
								temp.empty = f.empty;
								temp_seg.add(temp);
							}
						}

					}

					FOV_segment_dataStruct_list_withinFOV.add(new FOV_segment_dataStructure(temp_seg,fsd.radius));

					//Scan from heading to FOV_end second -? clockwise
				}
			}
			else
			{
				//Shadow copy is good enough here
				FOV_segment_dataStruct_list_withinFOV = FOV_segment_dataStruct_list;
			}

			//FIlter to act on empty or unempty segment
			//ArrayList<FOV_segment> filter_FOV_segment_list = new ArrayList<FOV_segment>();

			for (FOV_segment_dataStructure fsd : FOV_segment_dataStruct_list_withinFOV)
			{
				//Act on unempty segment
				if (act_on_empty_space == 0)
				{
					//Remove empty segment
					fsd.FOV_segment_list.removeIf(n -> n.empty == true);
				}
				//Act on empty segment
				else
				{
					//Remove unempty segment
					fsd.FOV_segment_list.removeIf(n -> n.empty == false);
				}
			}


			//General heading direction range
			int heading_start = 0;
			int heading_end = 0;

			/*
			//Heading now is a range
			if (Main.goals.isEmpty() == false)
			{
				//Inside hallway
				if (target_agent.getCurrentZone((Goal_rectangle) goals.get(1)) != 0)
				{
					ArrayList<Entity> select_goal_entity = new ArrayList<Entity>();

					select_goal_entity.add(goals.get(0));

					heading = getDirectiontoPosition(target_agent, select_goal_entity);

				}
				//Outside hallway
				else
				{
					Goal_rectangle hallway_zone = (Goal_rectangle) goals.get(1);

					heading_end = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos1);
					heading_start = target_agent.position.convertFromPositionToAngle(target_agent.position, hallway_zone.zone_goal.pos4);


				}

			}
*/
			//FOV_segment list here should contain either all empty or all occupied segment
			//Reduce the segment so that there is no overlap between segments
			//Check the furthest one first since it provides the farthest distance that agents can travel
			Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

			int[] circle_hit_original = new int[360];

			//Circle_hit includes a list of number from 1 - size of FOV_list
			int[] circle_hit = new int[360];

			boolean check_furthest_segment = false;


			int size = FOV_segment_dataStruct_list_withinFOV.size();
			//Reduce the segment so that there is no overlap between segments
			for (FOV_segment_dataStructure fov_seg_struct : FOV_segment_dataStruct_list_withinFOV)
			{

				for (FOV_segment chosen_segment : fov_seg_struct.FOV_segment_list)
				{

					for (int a = 0; a < circle_hit.length; a++)
					{
						if (check_furthest_segment == false)
						{
							if (a >= chosen_segment.range_start && a <= chosen_segment.range_end)
							{
								circle_hit[a] = size;
								circle_hit_original[a] = size;
							}
						}
						//This should be chosen after the first loop is done
						else
						{

							if (a > chosen_segment.range_start && a < chosen_segment.range_end && circle_hit[a] == 0)
							{
								circle_hit[a] = size;
								circle_hit_original[a] = size;
							}
						}

					}
				}



				size--;
				check_furthest_segment = true;
			}

			for (int a = 0; a < circle_hit.length; a++)
			{

				if (heading_start < heading_end)
				{
					if ((a>= heading_start && a <= heading_end) == false)
					{
						circle_hit[a] = 0;

					}

				}
				else
				{
					if ((a>= heading_start && a <= 359 || a>=0 && a< heading_end) == false)
					{
						circle_hit[a] = 0;
					}

				}
			}

			/*
					for (int a = 0; a < circle_hit.length; a++)
					{
						System.out.println(a + " " + circle_hit[a]);

					}
			 */


			Collections.reverse(FOV_segment_dataStruct_list_withinFOV);

			//CHeck if there is at least one segment to work on.
			//This is different from there_is_segment_in_general_heading where that variable check if there is a segment within generaal direction range.
			boolean null_FOV = true;

			for (int a = 0; a < circle_hit_original.length; a++)
			{
				//System.out.println(a + " " + circle_hit[a]);

				if (circle_hit_original[a] != 0)
				{

					null_FOV = false;
					break;
				}
			}

			//original_segment_dataStructure_list contains the segment so that there is no overlap between segments
			return convertFromSegmentArrayToArrayList(circle_hit_original, FOV_segment_dataStruct_list_withinFOV);

		}
		else
		{
			return null;
		}
		
		
	}
}




