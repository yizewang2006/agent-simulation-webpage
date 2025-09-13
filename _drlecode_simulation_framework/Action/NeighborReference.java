package Action;

import java.util.ArrayList;
import java.util.Random;

import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import agents.Agent;
import agents.Position;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;

public class NeighborReference extends Action
{
	public ArrayList<Filter> filter_chain = new ArrayList<Filter>();
	
	public NeighborReference()
	{
		
	}
	
	//Set a random Neighbor Reference behavior
	//Need offset and filter
	public NeighborReference(double extract_p)
	{
		super(1, extract_p, 0);
		//Set a random filter_chain
		Filter f = new Filter();
		//FOr now, a filter of behavior must have 
		this.filter_chain = f.setRandomFilterChain(new NeighborReference());
		
		Random rand = new Random();
		
		ArrayList<Double> offset_list = Main.searchSpace.getOffsetList(extract_p);
		this.offset = offset_list.get(rand.nextInt(offset_list.size()));
		

	}
	
	//Preset behavior
	public NeighborReference(double offset, ArrayList<Filter> filter_c, double extract_p)
	{
		super(1, extract_p, offset);
		this.filter_chain = filter_c;
	}
	
	public double getReferenceValue(Agent target_agent, ArrayList<Entity> neighbor_entities)
	{
		ArrayList<Entity> return_entity = Main.utility.getFilteredAgents(filter_chain, target_agent, neighbor_entities, timestep);
		
		//Check public and private property here
		boolean public_p = target_agent.checkPropertyPublicStatus(extract_property);
		
		//In many cases, return_entity will not contain any agents.
		//In such those cases, agent will not have any entity to act on
		if (return_entity.size() == 0)
		{
			return Double.NaN;
		}
		//There is at least one entity in return_entity
		else
		{
			if (public_p == true)
			{
				//Property that make heading direction change
				//             POSITION     HEADING DIRECTION    HEADING DIFFERENCE
				if(extract_property == 1 || extract_property == 2 || extract_property == 2.1)
				{
					reference_value = getNeighborReferenceValue(extract_property, target_agent, return_entity);
					
					reference_value += offset;
					
					if (reference_value < 0)
					{
						reference_value = 360 + reference_value;
					}
					else if (reference_value > 360)
					{
						reference_value = reference_value - 360;
					}
					
					return reference_value;
				}
				//SPEED
				else if (extract_property == 3)
				{
					reference_value = getNeighborReferenceValue(extract_property, target_agent, return_entity);
					
					reference_value += offset;
					
					return reference_value;
				}
				//TYPE
				else if (extract_property == 4)
				{
					
					//FOR now, we do not care
					//TYPE is private property
				}
				//ZONE
				else if (extract_property == 5)
				{
					//FOR now, we do not care
					//ZONE is private property
				}
				//UNRESERVED PROPERTY
				else 
				{

				}
				
			}

		}
		
		System.out.println("Not return a reference value of neighbor reference action properly");
		
		return 0;
	}
	
	public double getNeighborReferenceValue(double extract_p, Agent target_agent, ArrayList<Entity> neighbor_entities)
	{
		double reference_value = 0;
		
		//Need to think about global vs local, public vs private

		//POSITION
		//need to convert to heading direction
		if(extract_p == 1)
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
					//Find no_warp_distance first
					double distance_no_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, ne.position);
					
					//Find warp_distance
					Position ne_warp = ne.position.getWarpPosition(target_agent.position, ne.position);
					
					if (ne_warp.x == 0 && ne_warp.y == 0)
					{
						angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ne.position));
					}
					else
					{
						double distance_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, ne_warp);
						
						if (distance_no_warp <= distance_warp)
						{
							angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ne.position));
						}
						else
						{
							angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ne_warp));
						}
					}
					
					
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
						//Find no_warp_distance first
						double distance_no_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, ng.position);
						
						//Find warp_distance
						Position ne_warp = ng.position.getWarpPosition(target_agent.position, ng.position);
						
						if (ne_warp.x == 0 && ne_warp.y == 0)
						{
							angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.position));
						}
						else
						{
							double distance_warp = target_agent.position.getDistanceBetween2Position(target_agent.position, ne_warp);
							
							if (distance_no_warp <= distance_warp)
							{
								angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ng.position));
							}
							else
							{
								angle_convert.add((double) target_agent.position.convertFromPositionToAngle(target_agent.position, ne_warp));
							}
						}
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
		//HEADING DIRECTION
		else if (extract_p == 2)
		{
			double temp_heading = 0;
			double sumSin = 0;
			double sumCos = 0;
			int size = 0;
			
			for (Entity e : neighbor_entities)
			{

				if (e instanceof Agent)
				{
					Agent ne = (Agent) e;
					temp_heading = ne.heading.value * Math.PI/180;

					sumSin += Math.sin(temp_heading);
					sumCos += Math.cos(temp_heading);
					size++;
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
						Goal_point g_p = (Goal_point) e;
						temp_heading = g_p.heading * Math.PI/180;

						sumSin += Math.sin(temp_heading);
						sumCos += Math.cos(temp_heading);
						size++;
					}
					
				}

			}
			
			if (size == 0)
			{
				reference_value = target_agent.heading.value;
			}
			else
			{
				double next_headingInRad = Math.atan2(sumSin/size, sumCos/size);

				reference_value = (int) (next_headingInRad*180/Math.PI);

				if (reference_value < 0)
				{
					reference_value += 360;
				}
			}
			
			
			return reference_value;
		}
		//HEADING TO TARGET AGENT
		else if (extract_p == 2.1)
		{
			double temp_heading = target_agent.heading.value;
			int size = 0;
			
			for (Entity e : neighbor_entities)
			{

				if (e instanceof Agent)
				{
					Agent ne = (Agent) e;
					double angle_dif = 0;

					Position temp_position = ne.position;

					if (e.warp == true)
					{
						temp_position = target_agent.position.getWarpPosition(target_agent.position, ne.position);
					}
					
					angle_dif = target_agent.position.convertFromPositionToAngle(target_agent.position, temp_position);

					//angle_dif = angle_dif - target_agent.heading.value;

					while(angle_dif > 180)
					{
						angle_dif = 360 - angle_dif;
					}

					temp_heading += angle_dif;
					size ++;
				}
				else if (e instanceof Obstacle)
				{
					if (e instanceof Obstacle_rectangle)
					{
						Obstacle_rectangle or = (Obstacle_rectangle) e;

						Position or_center = new Position((or.pos1.x + or.pos2.x)/2, (or.pos1.y + or.pos4.y)/2);

						double angle_dif = 0;

						Position temp_position = or_center;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, or_center);
						}
						
						angle_dif = target_agent.position.convertFromPositionToAngle(target_agent.position, temp_position);

						//angle_dif = angle_dif - target_agent.heading.value;

						while(angle_dif > 180)
						{
							angle_dif = 360 - angle_dif;
						}

						temp_heading += angle_dif;
						size ++;
					}
					else if (e instanceof Obstacle_circle)
					{
						Obstacle_circle oc = (Obstacle_circle) e;
						double angle_dif = 0;

						Position temp_position = oc.pos;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, oc.pos);
						}
						
						angle_dif = temp_position.convertFromPositionToAngle(target_agent.position, temp_position);

						//angle_dif = angle_dif - target_agent.heading.value;

						while(angle_dif > 180)
						{
							angle_dif = 360 - angle_dif;
						}

						temp_heading += angle_dif;
						size ++;
					}

				}
				else if (e instanceof Goal)
				{
					//Not care for now
				}

				
			}
			
			if (size == 0)
			{
				reference_value = target_agent.heading.value;
			}
			else
			{
				reference_value = temp_heading/size;
				
				return reference_value;
			}
			
		}
		//SPEED
		else if (extract_p == 3)
		{
			double temp_speed = 0;
			int size = 0;
			
			for (Entity e : neighbor_entities)
			{

				if (e instanceof Agent)
				{
					Agent ne = (Agent) e;
					temp_speed += ne.speed.value;
					size++;
				}
				else if (e instanceof Obstacle)
				{
					if (e instanceof Obstacle_rectangle)
					{

					}
					else if (e instanceof Obstacle_circle)
					{

					}

				}
				else if (e instanceof Goal)
				{
					//Not care for now
					if (e instanceof Goal_point)
					{
						Goal_point g_p = (Goal_point) e;
						temp_speed += g_p.speed;
						size++;
					}
				}

			}
			
			if (size == 0)
			{
				reference_value = target_agent.speed.value;
			}
			else
			{
				reference_value = temp_speed/size;
			}
			return reference_value;
			
		}
		//TYPE
		else if (extract_p == 4)
		{
			//For now we do not care
			
			//Type is private property
		}
		//ZONE
		else if (extract_p == 5)
		{
			//For now we do not care
			//zone is private property
		}
		//angle differences between target and neighbor agent 
		else if (extract_p == 6)
		{ 
			//
		}
		//UNRESERVED PROPERTY
		else 
		{

		}


		return reference_value;
	}
}
