package agents;

import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.Stack;

import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import Utility.GlobalVariable;
import Utility.PositionAngle_DataStructure;
import Utility.ReturnSenseObstacle;
import Utility.myUtility;
import behavior.Behavior;
import core.Main;
import core.Model;
import entities.Entity;
import filters.Filter_ranged;
import obstacles.Obstacle;
import obstacles.Obstacle_circle;
import obstacles.Obstacle_rectangle;
import zones.Zone;

public class FieldOfView 
{
	public GlobalVariable global_var = new GlobalVariable();
	public myUtility myUtility = new myUtility();
	
	public double view_distance; //How far an agent can see
	public int view_angle; //How wide an agent can see
	
	
	public FieldOfView()
	{
		
	}
	
	public FieldOfView(double view_distance, int view_angle)
	{
		this.view_distance = view_distance;
		this.view_angle = view_angle;
		
		
	}
	
	//Now need to make it work with warp world as well
	public ArrayList<FOV_segment_dataStructure> getEntityWithAdaptiveFOV(ArrayList<Entity> entities, ArrayList<Obstacle> obstacles, Agent target_agent, int timesteps)
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
				Position nearest_point = nearestCorner(target_agent, o);
				
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
				ArrayList<PositionAngle_DataStructure> itersections = get2BoundInteresectionwithObstacle(target_agent, o, nearest_point, target_agent.fov.view_distance);
				
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
						if ((getEntityIn_First_Last_Segment(target_agent, oc, FOV_start)) == true 
							|| (getEntityIn_First_Last_Segment(target_agent, oc, FOV_end)) == true)
						{
							oc.always_sense = true;
							entities.add(oc);
						}
							
					}
				}

			}
		}
				
		
		//Get sorted entity base on distance to the target_agent
		//This sorted entity will have only 3 agents to get FOV_distance from
		//nearest, farthest,and average
		ArrayList<Entity> sorted_entity = getSortedDistanceEntity(target_agent, entities, timesteps);
		
		
		//Each point of rectangle entity is considering as a dummy agent.
		//At the end, all we care is position and its radius
		for (Entity e1: sorted_entity)
		{
			return_list = new ArrayList<FOV_segment>();
			
			for (Entity e: entities)
			{

				//If distance is less than personal space -> check by default.
				//Add an extra value to e1 distance to take care of cases where a group of agents are too close to each other
				//For example: distance from target agent to a1 is 10, and to a2 is 10.5
				//a2 is not counted here, but provide just 0.5 space for agent to move -> not worth it.
				//So we need to include a2 anyway.
				if (e.distance <= e1.distance + Main.global_var.empty_space_therhold || e.distance < Main.global_var.agent_personal_space - Main.global_var.agent_radius)
				//if (e.distance <= e1.distance)
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
								ArrayList<PositionAngle_DataStructure> tangent_set = get2TangentLinewithCricleObstacle(target_agent, pos_e, radius_e,imagination_agent) ;
								
								
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
								if (diffBetween2AnglesIncrease(head_start, head_end) <= 184)
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
				
			}
			
			
			for (Obstacle o : obstacles)
			{
				if (o instanceof Obstacle_rectangle)
				{
					//This list should contains all bound itesection of target agent and obstacles.
					//For each obstacle, this list should return only 2 elements
					
					Position nearest_corner = nearestCorner(target_agent, o);
					
					ArrayList<PositionAngle_DataStructure> itersections = get2BoundInteresectionwithObstacle(target_agent, o, nearest_corner, e1.distance);

					//Only add new segment if target agent intersects with rectangle obstacle at 2 different points.

					if (itersections.size() == 2)
					{

						double temp_x = target_agent.position.x - itersections.get(0).position.x ;
						double temp_y = target_agent.position.y - itersections.get(0).position.y ;

						double dis = Math.sqrt(Math.pow(temp_x,2) + Math.pow(temp_y,2));

						//Is agent heads in or head out of the obstacle

						//Relax to include very small wrong margin
						if (dis <=  e1.distance + 0.1)
						{
							FOV_segment a_segment = null;
							//agent heads toward to obstacle
							
							//If somehow difference between head_start and head_end > 180
							//-> it means agent sense entity behind it, hence head_start and head_end need to be switched
							if (diffBetween2AnglesIncrease(itersections.get(0).angle, itersections.get(1).angle) <= 184)
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
				else if (o instanceof Obstacle_circle)
				{

				}
				
				
			
			}
			
			////////////////////////////////////////////
			FOV_seg_dataStruct.add(new FOV_segment_dataStructure(return_list, e1.distance));
		}
		
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
	        
	        if (add_360_empty_segment == true)
			{
				//return_list.add(a_segment);
				
				//If all FOV is empty -> default distance is the max distance = fov_distance
				FOV_seg_dataStruct.add(0,new FOV_segment_dataStructure(return_list_360_segment, empty_360_distance));
			}

			
		}
		
		
		return FOV_seg_dataStruct;
	}
	
	//this list contains 2 sub array list
	//first array is entities within FOV range
	//the second list is entities of 360 range.
	public ArrayList<ArrayList<Entity>> getEntityWithinFOV(ArrayList<Entity> entities, Agent target_agent, int timesteps)
	{
	
		ArrayList<ArrayList<Entity>> observed_entities = new ArrayList<ArrayList<Entity>>();
		
		ArrayList<Entity> entity_withinRange = new ArrayList<Entity>();
		ArrayList<Entity> entity_360Range = new ArrayList<Entity>();
		
		Obstacle observed_obstacle = null;
		
		Goal observed_goal = null;
		
		double obstacle_distance = Double.MAX_VALUE;
		
		int range_right = (int) (target_agent.heading.value - view_angle/2);
		int range_left = (int) (target_agent.heading.value + view_angle/2);
		
		for (Entity e: entities)
		{
			//Agent type
			if(e instanceof Agent)
			{
				Agent a = (Agent) e;
				
				if (getCircleEntityWithinFOV(target_agent, a.position, range_right, range_left, a.radius, timesteps) == true)
				{
					e.sense = true;
					entity_withinRange.add(e);
				}
				
				if (getCircleEntityWithinFOV(target_agent, a.position, 0, 359,a.radius, timesteps) == true)
				{
					e.sense = true;
					entity_360Range.add(e);
				}
				
				//If the world is warp
				//Need to include warped entity as well
				if (Main.global_var.worldWarp == true)
				{
					if (getWarpCircleEntityWithinFOV(target_agent, a.position, range_right, range_left, timesteps) == true)
					{
						e.sense = true;
						e.warp = true;
						entity_withinRange.add(e);
					}
					
					if (getWarpCircleEntityWithinFOV(target_agent, a.position, 0, 359, timesteps) == true)
					{
						e.sense = true;
						e.warp = true;
						entity_360Range.add(e);
					}
				}
			}
			
			//Obstacle type
			//For entity = 360, the sorely purpose is to re-use it for adaptiveFOV
			//in adaptive FOV method. rectangle obstacle is treat separately
			else if (e instanceof Obstacle)
			{
				if (e instanceof Obstacle_rectangle)
				{
					
					Obstacle_rectangle or = (Obstacle_rectangle) e;
					
					
					
					ReturnSenseObstacle sense_obstacle = getRectangleObstacleDistanceWithinFOV(target_agent, target_agent.heading.value, or, timesteps);

					
					/*
					System.out.println("POS1 x:" + or.pos1.x +" y: " + or.pos1.y);
					System.out.println("POS2 x:" + or.pos2.x +" y: " + or.pos2.y);
					System.out.println("POS3 x:" + or.pos3.x +" y: " + or.pos3.y);
					System.out.println("POS4 x:" + or.pos4.x +" y: " + or.pos4.y);
					*/
					
					//Because agent sense the obstacle by measuring the distance it will impact 
					//Only the nearest distance obstacle is needed
					if (sense_obstacle != null)
					{
						if (sense_obstacle.distance < obstacle_distance)
						{
							obstacle_distance = sense_obstacle.distance;
							observed_obstacle = sense_obstacle.obstacle;
						}
							
					}
				}
				
				else if (e instanceof Obstacle_circle)
				{
					Obstacle_circle e_c = (Obstacle_circle) e;
					Double dis = Math.sqrt(Math.pow(target_agent.position.x - e_c.pos.x, 2) + Math.pow(target_agent.position.y - e_c.pos.y, 2));
					
					if (dis <= target_agent.fov.view_distance + e_c.radius)
					{

						Position temp_position = target_agent.position;

						int heading_to_center_ob = temp_position.convertFromPositionToAngle(target_agent.position, e_c.pos);
						
						int angle_dif = Math.abs(heading_to_center_ob - target_agent.heading.value);
						
						if (angle_dif > 180)
						{
							angle_dif = 360 - angle_dif;
						}
								
						if (angle_dif <= target_agent.fov.view_angle/2)
						{
							e_c.sense = true;
							entity_withinRange.add(e_c);
						}
						
						//With 360 FOV, we do not care for range.
						//As long as distance is condition is true
						entity_360Range.add(e);
					}
				}
				
			}
			//Goal type
			else if (e instanceof Goal)
			{
				/*
				if (e instanceof Goal_point)
				{
					
				}
				else if (e instanceof Goal_rectangle)
				{
					Goal_rectangle gr = (Goal_rectangle) e;
					
					Obstacle_rectangle dummy = new Obstacle_rectangle(gr.zone_goal.pos1, gr.zone_goal.width, gr.zone_goal.height, gr.type.value);
					
					ReturnSenseObstacle sense_goal = getRectangleObstacleDistanceWithinFOV(target_agent, dummy, timesteps);
					
					if (sense_goal != null)
					{
						if (sense_goal.distance < obstacle_distance)
						{
							obstacle_distance = sense_goal.distance;
							observed_goal = (Goal) e;
						}
							
					}
				}
				*/
			}
		}
		
		//This is only for rectangle obstacle, sense agent can only sense at most one rectangle obstacle at one time.
		if (observed_obstacle != null)
		{
			observed_obstacle.sense = true;
			entity_withinRange.add(observed_obstacle);
			entity_360Range.add(observed_obstacle);
		}
		
		observed_entities.add(entity_withinRange);
		observed_entities.add(entity_360Range);
		
		return observed_entities;
	}
	
	
	public ArrayList<Entity> getEntityWithinFOV_forSnakeShape_Sametype(ArrayList<Entity> entities, Agent target_agent, int timesteps)
	{
		ArrayList<Entity> observed_entities = new ArrayList<Entity>();
		
		Obstacle observed_obstacle = null;
		
		return observed_entities;
	}
	
	public Boolean getWarpCircleEntityWithinFOV(Agent target_agent, Position scanning_entity_pos, int range_r, int range_l, int timesteps)
	{
		//Need to check if fov of agent is out of bound or not

		//Change position of target_agent here, so that it can see other side
		//Check if FOV is out of bound -> need to be warp	
		
		//This agent temp has the update warp position of target_agent
		Agent temp_agent = new Agent (target_agent);
		
		//Warp corner - if agents are in UP LEFT - Up RIGHT - BOTTOM LEFT - BOTTOM RIGHT
		//We will need to warp agents' positions to all others corner 
		//TOP LEFT x+ y+
		if(target_agent.position.y < target_agent.fov.getViewDistance() && target_agent.position.x < target_agent.fov.getViewDistance())
		{
			
			//warp RIGHT 
			temp_agent.position.x = target_agent.position.x + Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y;
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius, timesteps) == true)
			{
				return true;
			}
			
			//warp BOTTOM
			temp_agent.position.x = target_agent.position.x;
			temp_agent.position.y = target_agent.position.y + Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l,temp_agent.radius, timesteps) == true)
			{
				return true;
			}
			
			//warp RIGHT - BOTTOM conner
			temp_agent.position.x = target_agent.position.x + Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y + Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
		}
		//TOP RIGHT x- y+
		else if (target_agent.position.y < target_agent.fov.getViewDistance() && target_agent.position.x > Main.global_var.WorldSize_width - target_agent.fov.getViewDistance())
		{
			//warp LEFT 
			temp_agent.position.x = target_agent.position.x - Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y;
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp BOTTOM
			temp_agent.position.x = target_agent.position.x;
			temp_agent.position.y = target_agent.position.y + Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp LEFT - BOTTOM corner
			temp_agent.position.x = target_agent.position.x - Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y + Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		//BOTTOM LEFT x+ y-
		else if (target_agent.position.y > Main.global_var.WorldSize_height - target_agent.fov.getViewDistance() && target_agent.position.x < target_agent.fov.getViewDistance())
		{
			//warp RIGHT 
			temp_agent.position.x = target_agent.position.x + Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y;
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp TOP
			temp_agent.position.x = target_agent.position.x;
			temp_agent.position.y = target_agent.position.y - Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp RIGHT - TOP corner
			temp_agent.position.x = target_agent.position.x + Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y - Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		//BOTTOM RIGHT x- y-
		else if (target_agent.position.y > Main.global_var.WorldSize_height - target_agent.fov.getViewDistance() && target_agent.position.x > Main.global_var.WorldSize_width - target_agent.fov.getViewDistance())
		{
			//warp LEFT 
			temp_agent.position.x = target_agent.position.x - Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y;
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp TOP
			temp_agent.position.x = target_agent.position.x;
			temp_agent.position.y = target_agent.position.y - Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			//warp LEFT - TOP corner
			temp_agent.position.x = target_agent.position.x - Main.global_var.WorldSize_width;
			temp_agent.position.y = target_agent.position.y - Main.global_var.WorldSize_height;
			
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		//RIGHT side x-
		else if (target_agent.position.x > Main.global_var.WorldSize_width - target_agent.fov.getViewDistance())
		{
			//warp RIGHT 
			temp_agent.position.x = target_agent.position.x - Main.global_var.WorldSize_width;
			
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
			
			
		}
		//LEFT side x+
		else if(target_agent.position.x < target_agent.fov.getViewDistance())
		{
			//warp RIGHT 
			temp_agent.position.x = target_agent.position.x + Main.global_var.WorldSize_width;
			
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		//TOP side y+
		else if(target_agent.position.y < target_agent.fov.getViewDistance())
		{
			//warp BOTTOM
			temp_agent.position.y = target_agent.position.y + Main.global_var.WorldSize_width;
			
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		//BOTTOM side y-
		else if(target_agent.position.y > Main.global_var.WorldSize_height - target_agent.fov.getViewDistance())
		{
			//warp TOP
			temp_agent.position.y = target_agent.position.y - Main.global_var.WorldSize_width;
			
			//Need to find all entity within FOV of target agent after warping
			if (getCircleEntityWithinFOV(temp_agent, scanning_entity_pos, range_r, range_l, temp_agent.radius,timesteps) == true)
			{
				return true;
			}
		}
		
		return false;
	}
	

	//function that returns all the observed agents
	//agents: list of all the agents
	//target_agent: current agent - center of the circle fov
	//heading: current agent heading direction
	//timestep: current time step of the simulation
	public Boolean getCircleEntityWithinFOV(Agent target_agent, Position scanning_entity_pos, int range_r, int range_l, double entity_radius, int timesteps)
	{
		
		int range_right = range_r;
		int range_left = range_l;

	
		//range_right = (int) (target_agent.heading.value - view_angle/2);
		//range_left = (int) (target_agent.heading.value + view_angle/2);
		
		//No need to compare target_agent with itself
		if (scanning_entity_pos.equals(target_agent.position) == false)
		{

			// temp_x = (x_target - x_i) 
			double temp_x = scanning_entity_pos.getX() - target_agent.position.getX();

			// temp_y = (y_target - y_i)
			double temp_y = scanning_entity_pos.getY() - target_agent.position.getY();

			//get the distance between target_agent and agent(i)
			double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2)) - Main.global_var.agent_radius;

			//Filter view_distance first
			//Find all agents within the view_distance of target agents
			if(dis - entity_radius < target_agent.fov.view_distance )
			{
				double compare_angle = 0;

				//System.out.println("Agents:" + i + " in a neighbor");

				//All the position of agent(i) and target_agent is compared base on origin (0,0),
				//In this case is top left of panel
				//upper half
				if(temp_y < 0)
				{
					//left half
					if (temp_x < 0)
					{
						//agent(i) is on UPPER - LEFT of agent_target
						compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 90;

						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							return true;
						}
						else
						{
							return false;
						}

					}
					//right half
					else if(temp_x > 0)
					{
						//agent(i) is on UPPER - RIGHT of agent_target
						compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x)));

						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							//Agent(i) is within view_angle of target agent
							return true;
						}
						else
						{
							return false;
						}

					}
					//special case temp_x = 0
					else
					{
						//Because we are currently checking UPPER half
						compare_angle = 90;
						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							//Agent(i) is within view_angle of target agent
							return true;
						}
						else
						{
							return false;
						}

					}

				}
				//lower half
				else if (temp_y > 0)	
				{
					//left half
					if (temp_x < 0)
					{
						//agent(i) is on LOWER - LEFT of agent_target
						compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_y/temp_x))) + 180;

						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							//Agent(i) is within view_angle of target agent
							return true;
						}
						else
						{
							return false;
						}

					}
					//right half
					else if(temp_x > 0)
					{
						//agent(i) is on LOWER - RIGHT of agent_target
						compare_angle = Math.abs(Math.toDegrees(Math.atan(temp_x/temp_y))) + 270;

						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							//Agent(i) is within view_angle of target agent
							return true;
						}
						else
						{
							return false;
						}

					}
					//special case temp_x = 0
					else
					{
						//Because we are currently checking LOWER half
						compare_angle = 270;
						if (insideFOV(compare_angle, range_right, range_left) == true)
						{
							//Agent(i) is within view_angle of target agent
							return true;
						}
						else
						{
							return false;
						}

					}
				}
				//special case temp_y = 0
				else if (temp_y == 0)
				{
					//Allow overlap
					//temp_x = 0 and temp_y = 0 means that agnet(i) and agent_target are overlab
					if(temp_x >= 0)
						compare_angle = 0;
					else if (temp_x < 0)
						compare_angle = 180;

					if (insideFOV(compare_angle, range_right, range_left) == true)
					{
						//Agent(i) is within view_angle of target agent
						return true;
					}
					else
					{
						return false;
					}

				}
				//Filter view_angle
			}
		}


		return false;
	}
	
	//Can only sense the nearest bound
	public ReturnSenseObstacle getRectangleObstacleDistanceWithinFOV(Agent target_agent, int heading_direciton, Obstacle_rectangle o, int timesteps)
	{
		ReturnSenseObstacle return_value = null;
		
		//Opposite side
		double a1 = 0;
		//Hypothnuse side
		double a2 = 0;
		//adjacent side
		double a3 = 0;

		//The distance from agent to the zone bound
		//The distance here is the distance between agent heading angle to the zone, not perpendicular one
		double d = 0;

		

		
		Position pos = null;


		//heading = target_agent.heading.value;
		double heading = heading_direciton;
		pos = target_agent.position;

		int agent_radius = Main.global_var.agent_radius + 1;
		
		//Check to see which quarter target agent heading belong to
		//Special cases
		if (heading >= 360)
		{
			heading = heading - 360;
		}
		else if (heading < 0)
		{
			heading = 360 + heading;
		}
		
		if (heading == 0 || heading == 90 || heading == 180 || heading == 270)
		{
			if (heading == 0)
			{
				//Only need to care for leftB
				if (o.leftB() - pos.x > 0 && pos.y >= o.upperB() - agent_radius && pos.y <= o.lowerB() + agent_radius)
				{
					double alpha = heading;
					d = (o.leftB() - pos.x) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to leftB");

					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos4, d, "left");
						return return_value;	
					}


				}

			}
			else if (heading == 90)
			{
				//Only need to care for lowerB
				if (pos.y - o.lowerB() > 0 && pos.x <= o.rightB() + agent_radius && pos.x >= o.leftB() - agent_radius)
				{
					double alpha = 90 - heading;
					d = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos3, o.pos4, d, "bottom");
						return return_value;	
					}
				}
			}
			else if (heading == 180)
			{
				//Only need to care for rightB
				if (pos.x - o.rightB() > 0 && pos.y >= o.upperB() - agent_radius && pos.y <= o.lowerB() + agent_radius)
				{
					double alpha = 180 - heading;
					d = (pos.x - o.rightB()) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to rightB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos2, o.pos3, d, "right");
						return return_value;	
					}
				}
			}
			else
			{
				//Only need to care for upperB
				if (o.upperB() - pos.y > 0 && pos.x >= o.leftB() - agent_radius && pos.x <= o.rightB() + agent_radius)
				{
					double alpha = 270 - heading;
					d = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to upperB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos2, d, "top");
						return return_value;	
					}
				}
			}
		}

		/*-----------------------------------------------*/
		//Handle lowerB and leftB
		else if (heading > 0 && heading < 90)
		{				
			//Find the distance from agent to the zone
			//Handle lowerB first
			if (pos.y - o.lowerB() > 0 && pos.x <= o.rightB() && pos.x >= o.leftB())
			{

				double alpha = 90 - heading;
				d = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));
				//Making Pytagon triangle
				double a = pos.y - o.lowerB();
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				//Take care for the cases where the heading direction is not touch lowerB
				if (pos.x + b < o.rightB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos3, o.pos4, d, "bottom");
						return return_value;	
					}
				}

			}

			//Handle leftB next
			if (o.leftB() - pos.x > 0 && pos.y >= o.upperB() && pos.y <= o.lowerB())
			{
				double alpha = heading;
				d = (o.leftB() - pos.x) / Math.cos(Math.toRadians(alpha));

				double a = o.leftB() - pos.x;
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				//Take care for the cases where the heading direction is not touch leftB
				if (pos.y - b > o.upperB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos4, d, "left");
						return return_value;	
					}
				}

			}

			//Handle the corner left down case
			if (pos.x < o.leftB() && pos.y > o.lowerB())
			{
				//Find if the heading direction cut into lowerB
				double alpha = 90 - heading;
				//making pytagon triangle
				double c = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));

				double a = pos.y - o.lowerB();

				double b = Math.sqrt(c*c - a*a);

				//Heading direction does not cut into lowerB
				//=> It must cut to leftB first
				if (pos.x + b < o.leftB())
				{
					alpha = heading;
					d = (o.leftB() - pos.x) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to leftB");


					if (d <= global_var.fov_distance)
					{
						//The second o.pos4 is the sense corner position
						//Is use to extract the position
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos4, o.pos4, d, "corner");
						return return_value;	
					}
				}
				//Direction cut into lowerB first
				else
				{
					alpha = 90 - heading;
					d = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos3, o.pos4, o.pos4, d, "corner");
						return return_value;	
					}
				}
			}

		}

		/*-----------------------------------------------*/
		//Handle lowerB and rightB
		else if (heading > 90 && heading < 180)
		{
			//Find the distance from agent to the zone
			//Handle lowerB first
			if (pos.y - o.lowerB() > 0 && pos.x <= o.rightB() && pos.x >= o.leftB())
			{
				double alpha = 90 - heading;
				d = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));

				double a = pos.y - o.lowerB();
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if(pos.x - b > o.leftB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos3, o.pos4, d, "bottom");
						return return_value;	
					}
				}

			}

			//Handle rightB next
			if (pos.x - o.rightB() > 0 && pos.y >= o.upperB() && pos.y <= o.lowerB())
			{
				double alpha = 180 - heading;
				d = (pos.x - o.rightB()) / Math.cos(Math.toRadians(alpha));

				double a = pos.x - o.rightB();
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if (pos.y - b > o.upperB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to rightB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos2, o.pos3, d, "right");
						return return_value;	
					}
				}

			}

			//Handle the corner right down case
			if (pos.x > o.rightB() && pos.y > o.lowerB())
			{
				//Find if the heading direction cut into lowerB
				double alpha = 90 - heading;
				//making pytagon triangle
				double c = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));

				double a = pos.y - o.lowerB();

				double b = Math.sqrt(c*c - a*a);

				//Heading direction does not cut into lowerB
				//=> It must cut to rightB first
				if (pos.x - b > o.rightB())
				{
					alpha = 180 - heading;
					d = (pos.x - o.rightB()) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to rightB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos2, o.pos3, o.pos3, d, "corner");
						return return_value;	
					}
				}
				//Direction cut into lowerB first
				else
				{
					alpha = Math.abs(90 - heading);
					d = (pos.y - o.lowerB()) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to lowerB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos3, o.pos4, o.pos3, d, "corner");
						return return_value;	
					}
				}
			}
		}


		/*-----------------------------------------------*/
		//Handle upperB and rightB
		else if (heading > 180 && heading < 270)
		{
			//Find the distance from agent to the zone
			//Handle upperB first
			if (o.upperB() - pos.y > 0 && pos.x >= o.leftB() && pos.x <= o.rightB())
			{
				double alpha = 270 - heading;
				d = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));

				double a = o.upperB() - pos.y;
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if (pos.x - b > o.leftB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to upperB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos2, d, "top");
						return return_value;	
					}
				}

			}

			//Handle rightB next
			if (pos.x - o.rightB() > 0 && pos.y >= o.upperB() && pos.y <= o.lowerB())
			{
				double alpha = 180 - heading;
				d = (pos.x - o.rightB()) / Math.cos(Math.toRadians(alpha));

				double a = pos.x - o.rightB();
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if (pos.y + b < o.lowerB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to rightB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos2, o.pos3, d, "right");
						return return_value;	
					}
				}

			}


			//Handle the corner top right case
			if (pos.x > o.rightB() && pos.y < o.upperB())
			{
				//Find if the heading direction cut into lowerB
				double alpha = 270 - heading;
				//making pytagon triangle
				double c = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));

				double a = o.upperB() - pos.y;

				double b = Math.sqrt(c*c - a*a);

				//Heading direction does not cut into lowerB
				//=> It must cut to right first
				if (pos.x - b > o.rightB())
				{
					alpha = Math.abs(180 - heading);
					d = (pos.x - o.rightB()) / Math.cos(Math.toRadians(alpha));


					//System.out.println("Timesteps: " + timesteps + ": " + d + "to rightB");
					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos2, o.pos3, o.pos2, d, "corner");
						return return_value;	
					}
				}
				//Direction cut into upper first
				else
				{
					alpha = 270 - heading;
					d = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));


					//System.out.println("Timesteps: " + timesteps + ": " + d + "to upperB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos2, o.pos2, d, "corner");
						return return_value;	
					}
				}
			}
		}


		/*-----------------------------------------------*/
		//Handle upperB and leftB
		else if (heading > 270 && heading < 360)
		{
			//Find the distance from agent to the zone
			//Handle upperB first
			if (o.upperB() - pos.y > 0 && pos.x >= o.leftB() && pos.x <= o.rightB())
			{
				double alpha = 270 - heading;
				d = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));

				double a = o.upperB() - pos.y;
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if (pos.x + b < o.rightB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to upperB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos2, d, "top");
						return return_value;	
					}
				}

			}

			//Handle leftB next
			if (o.leftB() - pos.x > 0 && pos.y >= o.upperB() && pos.y <= o.lowerB())
			{
				double alpha = heading;
				d = (o.leftB() - pos.x) / Math.cos(Math.toRadians(alpha));

				double a = o.leftB() - pos.x;
				double c = d;
				double b = Math.sqrt(c*c - a*a);

				if (pos.y + b < o.lowerB())
				{
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to leftB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos4, d, "left");
						return return_value;	
					}
				}

			}

			//Handle the corner top left case
			if (pos.x < o.leftB() && pos.y < o.upperB())
			{
				//Find if the heading direction cut into lowerB
				double alpha = 270 - heading;
				//making pytagon triangle
				double c = (o.upperB() - pos.y) / Math.cos(Math.toRadians(alpha));

				double a = o.upperB() - pos.y;

				double b = Math.sqrt(c*c - a*a);

				//Heading direction does not cut into lowerB
				//=> It must cut to left first
				if (pos.x + b < o.leftB())
				{
					alpha = heading;
					d = (o.leftB() - pos.x) / Math.cos(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to leftB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos4, o.pos1, d, "corner");
						return return_value;	
					}
				}
				//Direction cut into upper first
				else
				{
					alpha = 360 - heading;
					d = (o.upperB() - pos.y) / Math.sin(Math.toRadians(alpha));
					//System.out.println("Timesteps: " + timesteps + ": " + d + "to upperB");


					if (d <= global_var.fov_distance)
					{
						return_value = new ReturnSenseObstacle(o, o.pos1, o.pos2, o.pos1, d, "corner");
						return return_value;	
					}
				}
			}
		}
		
		return return_value;
	}
	
	public boolean insideFOV(double compare_angle, double range_right, double range_left)
	{
		boolean inside = false;
		
		//FOV right_range is in range [0-360] 
		if (range_right >= 0)
		{
			//FOV left_range is in range [0-360]
			if(range_left <= 360)
			{
				if((int)compare_angle >= range_right && (int)compare_angle <= range_left)
				{
					inside = true;
				}
			}
			//FOV left_range > 360
			//this case happens when heading angle is 340 and fov_angle is 90 for example
			// left_range is 385, right_range is 295
			else
			{
				range_left = range_left - 360;
				if ((int)compare_angle <= range_left || ((int)compare_angle >= range_right && (int)compare_angle <= 360))
				{
					inside = true;
				}
			}
		}
		//FOV right_range is in range [-180, 180]
		//this case happens when heading angle is 0 and fov_angle is 90 for example.
		//left_range is 45, but right_range is -45 or 315
		else if (range_right < 0 && range_left < 0)
		{
			range_right = 360 +range_right;
			range_left = 360 +range_left;
			
			if((int)compare_angle >= range_right && (int)compare_angle <= range_left)
			{
				inside = true;
			}
		}
		else if (range_right < 0 && range_left > 0)
		{
			range_right = 360 +range_right;
			
			
			if ((int)compare_angle <= range_left || ((int)compare_angle >= range_right && compare_angle <= 360))
			{
				inside = true;
			}
		}
		else if (range_right > 0 && range_left <0)
		{
			range_left = 360 + range_left;
			
			if((int)compare_angle >= range_right && (int)compare_angle <= range_left)
			{
				inside = true;
			}
		}
		
		return inside; 
	}
	
	public boolean passFilter(ArrayList<Filter_ranged> filters, Agent agent)
	{
		boolean pass = true;
		
		return pass;
	}
	
	public double getViewDistance()
	{
		return this.view_distance;
	}
	
	public int getViewAngle()
	{
		return this.view_angle;
	}
	
	
	public ArrayList<PositionAngle_DataStructure> get2BoundInteresectionwithObstacle(Agent target_agent, Obstacle rec_obs, Position nearest_corner, double distance)
	{
		
		ArrayList<PositionAngle_DataStructure> return2Intersection = new ArrayList<PositionAngle_DataStructure>();

		int FOV_start = (int) (target_agent.heading.value - 360/2);
		int FOV_end = (int) (target_agent.heading.value + 360/2);

		if (FOV_start < 0)
		{
			FOV_start = 360 + FOV_start;
		}
		
		if (FOV_end  > 360)
		{
			FOV_end = FOV_end - 360;
		}
		
		if (rec_obs instanceof Obstacle_rectangle)
		{
		
			ArrayList<Position> sense_pos_list = new ArrayList<Position>();

			Obstacle_rectangle ob_rec = (Obstacle_rectangle) rec_obs;
			
			
			//Check intersection between FOV side and obstacle edge

			ArrayList<Position> instesection_FOV_side = new ArrayList<Position>();
			
			//If the FOV is 360, FOV_edge does not matter anymore
			if (Main.global_var.fov_angle != 360)
			{
				instesection_FOV_side = ob_rec.getIntersection_FOV_Edge_and_RectangleObs(target_agent, ob_rec, distance);
			}
			

			ArrayList<Position> instesection_FOV_arc = ob_rec.getIntersection_FOV_Arc_and_RectangleObs(target_agent, ob_rec, distance);

			//Mean no intersection between FOV and the current check obstacle
			//This list should include only at max 2 position for each obstacle

			if (instesection_FOV_side.size() != 0 || instesection_FOV_arc.size() != 0)
			{
				//Add all intersection to a list
				for (Position p : instesection_FOV_side)
				{
					sense_pos_list.add(p);
				}

				for (Position p : instesection_FOV_arc)
				{
					sense_pos_list.add(p);
				}

				
				//If target_agent is already too close too an edge of the obstacle
				//Agent inside TOP EDGE zone
				if (target_agent.position.x >= ob_rec.pos1.x && target_agent.position.x <= ob_rec.pos2.x && target_agent.position.y < ob_rec.pos1.y)
				{
					//Too close to TOP EDGE
					if(Math.abs(target_agent.position.y - ob_rec.pos1.y) < Main.global_var.agent_radius + 2.5)
					{
						Position p_temp = new Position(target_agent.position.x, ob_rec.pos1.y);
						p_temp.type = "s_top";
						sense_pos_list.add(p_temp);
					}
				}
				//Agent inside RIGHT EDGE zone
				else if (target_agent.position.x > ob_rec.pos2.x && target_agent.position.y >= ob_rec.pos2.y && target_agent.position.y <= ob_rec.pos3.y)
				{
					//too close to the RIGHT EDGE
					if(Math.abs(target_agent.position.x - ob_rec.pos2.x) < Main.global_var.agent_radius + 2.5)
					{
						
						Position p_temp = new Position(ob_rec.pos2.x, target_agent.position.y);
						p_temp.type = "s_right";
						sense_pos_list.add(p_temp);
					}
				}
				//Agent inside BOTTOM EDGE zone
				else if (target_agent.position.x >= ob_rec.pos4.x && target_agent.position.x <= ob_rec.pos3.x && target_agent.position.y > ob_rec.pos3.y)
				{
					//too close to the BOTTOM EDGE
					if(Math.abs(target_agent.position.y - ob_rec.pos3.y) < Main.global_var.agent_radius + 2.5)
					{
						Position p_temp = new Position(target_agent.position.x, ob_rec.pos3.y);
						p_temp.type = "s_bottom";
						sense_pos_list.add(p_temp);
					}
				}
				//Agent inside LEFT EDGE zone
				else if (target_agent.position.x < ob_rec.pos1.x && target_agent.position.y >= ob_rec.pos1.y && target_agent.position.y <= ob_rec.pos4.y)
				{
					//too close to the LEFT EDGE
					if (Math.abs(target_agent.position.x - ob_rec.pos4.x) < Main.global_var.agent_radius + 2.5)
					{
						Position p_temp = new Position(ob_rec.pos1.x, target_agent.position.y);
						p_temp.type = "s_left";
						sense_pos_list.add(p_temp);
					}
				}
				
				 
				
				//Store all candidate heading list
				//Will need to choose the 2 bound from this list.
				ArrayList<Integer> head_to_list = new ArrayList<Integer>();
				ArrayList<PositionAngle_DataStructure> pos_angle_dataStruct = new ArrayList<PositionAngle_DataStructure>();
				int adjustment = 0;
				
				if (nearest_corner != null)
				{
					//For now, only deal with the nearest corner of an polygon obstacles
					if (ob_rec.PositionWithinAFOV(target_agent, nearest_corner, distance) == true)
					{
						if (nearest_corner.type.equals("c_pos1"))
						{
							if (nearest_corner.x == ob_rec.pos1.x && nearest_corner.y == ob_rec.pos1.y)
							{
								Position temp = new Position(nearest_corner.x, nearest_corner.y);

								temp.x -= adjustment;
								temp.y -= adjustment;
								temp.type = "c_pos1";
								sense_pos_list.add(temp);
							}

						}
						else if (nearest_corner.type.equals("c_pos2"))
						{
							if (nearest_corner.x == ob_rec.pos2.x && nearest_corner.y == ob_rec.pos2.y)
							{
								Position temp = new Position(nearest_corner.x, nearest_corner.y);

								temp.x += adjustment;
								temp.y -= adjustment;
								temp.type = "c_pos2";
								sense_pos_list.add(temp);
							}

						}
						else if (nearest_corner.type.equals("c_pos3"))
						{
							if (nearest_corner.x == ob_rec.pos3.x && nearest_corner.y == ob_rec.pos3.y)
							{
								Position temp = new Position(nearest_corner.x, nearest_corner.y);

								temp.x += adjustment;
								temp.y += adjustment;
								temp.type = "c_pos3";
								sense_pos_list.add(temp);
							}

						}
						else if (nearest_corner.type.equals("c_pos4"))
						{
							if (nearest_corner.x == ob_rec.pos4.x && nearest_corner.y == ob_rec.pos4.y)
							{
								Position temp = new Position(nearest_corner.x, nearest_corner.y);

								temp.x -= adjustment;
								temp.y += adjustment;
								temp.type = "c_pos4";
								sense_pos_list.add(temp);
							}

						}

					}
					
				}

				ArrayList<PositionAngle_DataStructure> tangent_set_corner = new ArrayList<PositionAngle_DataStructure>() ;
				
				for (Position p : sense_pos_list)
				{
					//int head_to = 0;

					//The previous implementation only consider the heading direction to the intersection
					//Hence for each itersection, we only need 1 direction
					
					//But now, the best way to deal with intersection is agent needs to find tangent line to 
					//each imagination agent with center is intersection point
					//hence for each intersection, we will need to have 2 heading directions for 2 tangent
					//one on the left, and one on the right
					if (p.type.contains("c_pos"))
					{
						//ps;
					}
					else
					{
						
					}
					
					ArrayList<PositionAngle_DataStructure> tangent_set = new ArrayList<PositionAngle_DataStructure>() ;
					
					double AC = Math.sqrt(Math.pow(target_agent.position.x - p.x,2) + Math.pow(target_agent.position.y - p.y,2));
					
					if (AC <= Main.global_var.agent_radius + 2.5)
					{
						
						if (p.type.contains("c_pos") || p.type.contains("s_"))
						{
							tangent_set_corner = get2TangentLinewithImaginationAgent(target_agent, ob_rec, p, Main.global_var.agent_radius) ;
							
							return2Intersection.add(new PositionAngle_DataStructure(tangent_set_corner.get(0).position, tangent_set_corner.get(0).angle));
							return2Intersection.add(new PositionAngle_DataStructure(tangent_set_corner.get(1).position, tangent_set_corner.get(1).angle));
							
							return return2Intersection;
							//tangent_set = get2TangentLinewithImaginationAgent(target_agent, ob_rec, p, Main.global_var.agent_radius) ;
						}
						else
						{
							tangent_set = get2TangentLinewithImaginationAgent(target_agent, ob_rec, p, Main.global_var.agent_radius) ;
						}
					}
					else
					{
						tangent_set = get2TangentLinewithCricleObstacle(target_agent, p, Main.global_var.agent_radius, true) ;
					}
					
					
					
					int head_start = tangent_set.get(0).angle;
					int head_end = tangent_set.get(1).angle;
					
					
					if (isCheckHeadingInsideFOV(target_agent, head_start, FOV_start, FOV_end) == false)
					{
						head_start = FOV_start;
					}
					
					if (isCheckHeadingInsideFOV(target_agent, head_end, FOV_start, FOV_end) == false)
					{
						head_end = FOV_end;
					}
					
					
					
					//System.out.println("R " + head_right);
					//System.out.println("L " + head_left);
										
 					//head_to = target_agent.position.convertFromPositionToAngle(target_agent.position, p);
					//head_to = target_agent.position.convertFromPositionToAngle(target_agent.position, p);

					head_to_list.add(head_start);
					pos_angle_dataStruct.add(new PositionAngle_DataStructure(p, head_start));
					
					head_to_list.add(head_end);
					pos_angle_dataStruct.add(new PositionAngle_DataStructure(p, head_end));
					
				}
				
				if (pos_angle_dataStruct.size() > 0)
				{
					double sumSin = 0;
					double sumCos = 0;
					double average_heading = 0;

					ArrayList<Integer> angle_list = new ArrayList<Integer>();
					
					//Finding the average
					for (PositionAngle_DataStructure pos_angle_struct : pos_angle_dataStruct)
					{
						angle_list.add(pos_angle_struct.angle);	
					}

					for (int heading : angle_list)
					{
						
						sumSin  += Math.sin(heading * Math.PI/180);
						sumCos += Math.cos(heading * Math.PI/180);
					}


					double average_heaing_inRad = Math.atan2( sumSin, sumCos);

					average_heading = (int) (average_heaing_inRad*180)/Math.PI;

					if (average_heading > 360)
					{
						average_heading += 360;
					}
						
					if (average_heading < 0)
					{
						average_heading = 360 + average_heading;
					}
					
					int max_different_start = Integer.MIN_VALUE;
					int max_different_end = Integer.MIN_VALUE;
					
					PositionAngle_DataStructure PositionAngle_start = null;
					PositionAngle_DataStructure PositionAngle_end = null;
					

					//From the average point, find 2 bounds
					for (PositionAngle_DataStructure pos_angle_struct : pos_angle_dataStruct)
					{
						int angle_dif = diffBetween2AnglesDecrease((int) average_heading, pos_angle_struct.angle);
						
						if (angle_dif > max_different_start && angle_dif < 180)
						{
							max_different_start = angle_dif;
							PositionAngle_start = new PositionAngle_DataStructure(pos_angle_struct.position, pos_angle_struct.angle);
							
						}
						
						angle_dif = diffBetween2AnglesIncrease((int) average_heading, pos_angle_struct.angle);
						
						if (angle_dif > max_different_end && angle_dif < 180)
						{
							max_different_end = angle_dif;
							PositionAngle_end = new PositionAngle_DataStructure(pos_angle_struct.position, pos_angle_struct.angle);
						}
					}
					
									
					PositionAngle_start.position.type = "intersect_with_rectangle";
					PositionAngle_end.position.type = "intersect_with_rectangle";
					
					//If head start and head end are the same -> only need to keep 1
					//It should be only happen if target agent is overlap with one of the corner of rectangle obstacles.
					return2Intersection.add(PositionAngle_start);
					return2Intersection.add(PositionAngle_end);
				}
				else
				{
					return return2Intersection;
				}
					
			}	

			
		}
		
		
		return return2Intersection;
	}
	
	public boolean isCheckHeadingInsideFOV(Agent target_agent, int check_heading, int FOV_s, int FOV_e)
	{
		
		check_heading = (360 + (check_heading % 360)) % 360;
		
		FOV_s = (3600000 + FOV_s) % 360;
		FOV_e = (3600000 + FOV_e) % 360;

		if (FOV_s < FOV_e)
			return FOV_s <= check_heading && check_heading <= FOV_e;
		return FOV_s <= check_heading || check_heading <= FOV_e;
		
		
	}
	
	public ArrayList<PositionAngle_DataStructure> get2TangentLinewithImaginationAgent(Agent target_agent, Obstacle_rectangle ob_rec, Position imagination_agent_pos, double radius)
	{
		ArrayList<PositionAngle_DataStructure> return2Tangent = new ArrayList<PositionAngle_DataStructure>();
		
		//Find which section agent belong to
		
		int head_start = 0;
		int head_end = 0;
		
		double x = target_agent.position.x;
		double y = target_agent.position.y;
		

		//overlap corner 1
		//overlap corner 2
		//overlap corner 3
		//overlap corner 4
		//LEFT-TOP
		if ((x < ob_rec.pos1.x && y < ob_rec.pos1.y) || (x > ob_rec.pos2.x && y < ob_rec.pos2.y) || (x > ob_rec.pos2.x && y > ob_rec.pos3.y) ||  (x < ob_rec.pos4.x && y > ob_rec.pos4.y))
		{
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

			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, head_start));
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, head_end));
		}
		//TOP
		else if (x >= ob_rec.pos1.x && x <= ob_rec.pos2.x && y < ob_rec.pos1.y)
		{
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 180));
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 359));
		}
		//TOP-RIGHT
		else if (x > ob_rec.pos2.x && y < ob_rec.pos2.y)
		{

		}
		//RIGHT
		else if (x > ob_rec.pos2.x && y >= ob_rec.pos2.y && y <= ob_rec.pos3.y)
		{
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 90));
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 270));
		}
		//RIGHT-BOTTOM
		else if (x > ob_rec.pos2.x && y > ob_rec.pos3.y)
		{

		}
		//BOTTOM
		else if (x >= ob_rec.pos4.x && x <= ob_rec.pos3.x && y > ob_rec.pos3.y)
		{
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 0));
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 180));
		}
		//BOTTOM-LEFT
		else if (x < ob_rec.pos4.x && y > ob_rec.pos4.y)
		{

		}
		//LEFT
		else if (x < ob_rec.pos1.x && y >= ob_rec.pos1.y && y <= ob_rec.pos4.y)
		{
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 270));
			return2Tangent.add(new PositionAngle_DataStructure(imagination_agent_pos, 90));
		}


		
		return return2Tangent;
	}
	
	public ArrayList<PositionAngle_DataStructure> get2TangentLinewithCricleObstacle(Agent target_agent, Position center, double radius, boolean imagination_agent)
	{
		ArrayList<PositionAngle_DataStructure> return2Tangent = new ArrayList<PositionAngle_DataStructure>();
		
		double r = 0;
		double sin_alpha = 0;
		double AB = 0;
		//observed_entities.add(e);
		//Get the angle bound for each agent
		double AC = Math.sqrt(Math.pow(target_agent.position.x - center.x,2) + Math.pow(target_agent.position.y - center.y,2));
		
		if (imagination_agent == true)
		{
			r = radius;
			sin_alpha = (radius)/AC;
			AB = Math.sqrt(Math.pow(AC,2) - Math.pow(radius,2));
		}
		else
		{
			r = radius + target_agent.radius;
			sin_alpha = (radius+target_agent.radius)/AC;
			AB = Math.sqrt(Math.pow(AC,2) - Math.pow(radius+target_agent.radius,2));
		}
		
		//double AB = Math.sqrt(Math.pow(AC,2) - Math.pow(radius,2));
		
		double cos_alpha = AB/AC;
		double c1 = center.x;
		double c2 = center.y;
		
		
		int head_start = 0;
		int head_end = 0;
		
		/*
		 * public ReturnSenseObstacle getRectangleObstacleDistanceWithinFOV(Agent target_agent, int heading_direciton, Obstacle_rectangle o, int timesteps)
		 */
		//This is where target agent is too close too an entity
		
		//The adjustment here is needed to deal with
		//cases where agent is very close to the edge -> the distance between touch and not touch the edge is less than 0.2
		//For target agent that is very close to imagination agent
		//OR
		//For target that is very close to real entity (agents, or circle obstacles)
		
		if ( (AC <= r + 0.2 && imagination_agent == true ) || (AC <= r && imagination_agent == false))
		{
			
			int heading_to_e = target_agent.position.convertFromPositionToAngle(target_agent.position, center);
			
			head_start = heading_to_e - 90;
			
			if (head_start < 0)
			{
				head_start = 360 + head_start;
			}
			
			head_end = heading_to_e + 90;
			
			if (head_end >= 360)
			{
				head_end = head_end - 360;
			}
			
			return2Tangent.add(new PositionAngle_DataStructure(center, head_start));
			return2Tangent.add(new PositionAngle_DataStructure(center, head_end));
			

		}
		else
		{
			double a1 = target_agent.position.x;
			double a2 = target_agent.position.y;
			
			//Get heading to the right
			double x = c1 + (r/AC)*((a1-c1)*sin_alpha + (a2 - c2)*cos_alpha);
			double y = c2 + (r/AC)*((a2-c2)*sin_alpha - (a1 - c1)*cos_alpha);
			
			Position head_to_start = new Position(x,y);
			
			
			head_start = target_agent.position.convertFromPositionToAngle(target_agent.position, head_to_start);

			if (head_start >= 360)
			{
				head_start = head_start - 360;
			}
			//If the head_start is less than FOV_end
			
			x = c1 + (r/AC)*((a1-c1)*sin_alpha - (a2 - c2)*cos_alpha);
			y = c2 + (r/AC)*((a2-c2)*sin_alpha + (a1 - c1)*cos_alpha);
			
			Position head_to_end = new Position(x,y);
			
			//Convert to heading direction
			
			head_end = target_agent.position.convertFromPositionToAngle(target_agent.position, head_to_end);
			
			if (head_end >= 360)
			{
				head_end = head_end - 360;
			}
			
			return2Tangent.add(new PositionAngle_DataStructure(head_to_start, head_start));
			return2Tangent.add(new PositionAngle_DataStructure(head_to_end, head_end));
		}
		
		
		
		return return2Tangent;
	}
	
	public boolean getEntityIn_First_Last_Segment(Agent target_agent, Entity e, int heading_by_bound)
	{
		double temp_x = 0;
		double temp_y = 0;
		int radius = 0;
		Position neighbor_position = null;
		
		if (e instanceof Agent)
		{
			Agent a = (Agent) e;
			// temp_x = (x_target - x_i) 
			temp_x = a.position.getX() - target_agent.position.getX();

			// temp_y = (y_target - y_i)
			temp_y = a.position.getY() - target_agent.position.getY();
			
			radius = a.radius;
			
			neighbor_position = a.position;
		}
		else if (e instanceof Obstacle_circle)
		{
			Obstacle_circle oc = (Obstacle_circle) e;
			
			// temp_x = (x_target - x_i) 
			temp_x = oc.pos.getX() - target_agent.position.getX();

			// temp_y = (y_target - y_i)
			temp_y = oc.pos.getY() - target_agent.position.getY();
			
			radius = oc.radius;
			
			neighbor_position = oc.pos;
		}
		

		double distance = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));


		if (heading_by_bound < 0)
		{
			heading_by_bound = 360 + heading_by_bound;
		}
		else if (heading_by_bound > 360)
		{
			heading_by_bound = heading_by_bound - 360;
		}


		//Find position of the FOV_line AB
		Position A = target_agent.position;
		
		int changeinX_fov = (int) (target_agent.fov.view_distance * Math.cos(Math.toRadians(heading_by_bound)));
		int changeinY_fov = (int) (target_agent.fov.view_distance * Math.sin(Math.toRadians(heading_by_bound)) * -1);

		int end_X_fov = (int)(target_agent.position.getX() + changeinX_fov);
		int end_Y_fov = (int)(target_agent.position.getY() + changeinY_fov);
		
		Position B = new Position(end_X_fov, end_Y_fov);
		
		double m = Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2);
		double n = (A.x - neighbor_position.x)*(B.x - A.x) + (A.y - neighbor_position.y)*(B.y - A.y);
		double p = Math.pow(A.x - neighbor_position.x, 2) + Math.pow(A.y - neighbor_position.y, 2) - Math.pow(radius, 2);
	
		double result = Math.pow(n, 2) - m * p;
		
		if (result < 0)
		{
			return false;
		}
		else if (result == 0)
		{
			double s = -n/m;
			
			if (0 <= s && s <= 1)
			{
				return true;
			}
		}
		else
		{
			double s1 = (-n + Math.sqrt(n*n - m*p))/m;
			double s2 = (-n - Math.sqrt(n*n - m*p))/m;
			
			if ((0 <= s1 && s1 <= 1 ) ||  (0 <= s2 && s2 <= 1))
			{
				return true;
			}
		}
		
		return false;
	}
	
	public ArrayList<FOV_segment> getFOVZoneSegment(Agent target_agent)
	{
		ArrayList<FOV_segment> FOV_segment_list = new ArrayList<FOV_segment>();
		
		int FOV_right_bound = (int) (target_agent.heading.value - this.view_angle/2);
		//int range_left = (int) (target_agent.heading.value + view_angle/2);
		
		int segment_wide = this.view_angle / Main.global_var.fov_segment;
		
		for (int i = 0; i < Main.global_var.fov_segment; i++)
		{
			int l_range = FOV_right_bound + (i*segment_wide);
			int u_range = l_range + segment_wide;
			
			FOV_segment_list.add(new FOV_segment (l_range, u_range));
		}
		
		return FOV_segment_list;
	}
	
	public int getHeadingSegment_index(Agent target_agent)
	{
		int return_index = 0;
		
		int FOV_right_bound = (int) (target_agent.heading.value - this.view_angle/2);
		//int range_left = (int) (target_agent.heading.value + view_angle/2);
		
		int segment_wide = this.view_angle / Main.global_var.fov_segment;
		
		int count = 0;
		for (int i = 0; i < Main.global_var.fov_segment; i++)
		{
			int l_range = FOV_right_bound + (i*segment_wide);
			int u_range = l_range + segment_wide;
			
			if (target_agent.heading.value > l_range && target_agent.heading.value < u_range)
			{
				return count;
			}
			
			count++;
		}
		
		return return_index;
	}
	
	public Position nearestCorner(Agent target_agent, Obstacle o)
	{
		Position nearest_corner  = null;
		double min_distance = Double.MAX_VALUE;
		

		if (o instanceof Obstacle_rectangle)
		{
			Obstacle_rectangle or = (Obstacle_rectangle) o;

			ArrayList<Position> corner_list = new ArrayList<>();
			corner_list.add(or.pos1);
			corner_list.add(or.pos2);
			corner_list.add(or.pos3);
			corner_list.add(or.pos4);

			int count = 0;

			for (Position corner : corner_list)
			{
				count++;

				double temp_x = Math.pow(target_agent.position.x - corner.x, 2);
				double temp_y = Math.pow(target_agent.position.y - corner.y, 2);

				double distance_temp = Math.sqrt(temp_x + temp_y);

				if (distance_temp < min_distance && or.PositionWithinAFOV(target_agent, corner, target_agent.fov.view_distance) == true)
				{
					min_distance = distance_temp;
					nearest_corner = corner;

					if (count == 1)
					{
						nearest_corner.type = "c_pos1";
					}
					else if (count == 2)
					{
						nearest_corner.type = "c_pos2";
					}
					else if (count == 3)
					{
						nearest_corner.type = "c_pos3";
					}
					else if (count == 4)
					{
						nearest_corner.type = "c_pos4";
					}
				}
			}

		}

		return nearest_corner;
	}
	
	/*
	public Position nearestCorner(Agent target_agent, ArrayList<Obstacle> obstacles)
	{
		Position nearest_corner  = null;
		double min_distance = Double.MAX_VALUE;
		
		for (Obstacle o : obstacles)
		{
			if (o instanceof Obstacle_rectangle)
			{
				Obstacle_rectangle or = (Obstacle_rectangle) o;
				
				ArrayList<Position> corner_list = new ArrayList<>();
				corner_list.add(or.pos1);
				corner_list.add(or.pos2);
				corner_list.add(or.pos3);
				corner_list.add(or.pos4);
				
				int count = 0;
				
				for (Position corner : corner_list)
				{
					count++;
					
					double temp_x = Math.pow(target_agent.position.x - corner.x, 2);
					double temp_y = Math.pow(target_agent.position.y - corner.y, 2);
					
					double distance_temp = Math.sqrt(temp_x + temp_y);
					
					if (distance_temp < min_distance && or.PositionWithinAFOV(target_agent, corner, target_agent.fov.view_distance) == true)
					{
						min_distance = distance_temp;
						nearest_corner = corner;
						
						if (count == 1)
						{
							nearest_corner.type = "c_pos1";
						}
						else if (count == 2)
						{
							nearest_corner.type = "c_pos2";
						}
						else if (count == 3)
						{
							nearest_corner.type = "c_pos3";
						}
						else if (count == 4)
						{
							nearest_corner.type = "c_pos4";
						}
					}
				}
				
			}
			
		}
		
		return nearest_corner;
	}
	*/
	
	public ArrayList<Entity> getSortedDistanceEntity(Agent target_agent, ArrayList<Entity> entity_list, int timesteps)
	{
		ArrayList<Entity> sorted_entity = new ArrayList<Entity>();
		
 		int FOV_start = (int) (target_agent.heading.value - 360/2);
		int FOV_end = (int) (target_agent.heading.value + 360/2);
		
		for (Entity e: entity_list)
		{
			boolean same_distance = false;
			
			if (e.equals(target_agent) == false)
			{
				if (e instanceof Agent)
				{
					Agent a = (Agent) e;
					
					if (getCircleEntityWithinFOV(target_agent, a.position, FOV_start, FOV_end, a.radius, timesteps) == true ||
						getWarpCircleEntityWithinFOV(target_agent, a.position, FOV_start, FOV_end, timesteps) == true	)
					{

						Position temp_position = a.position;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, a.position);
						}
						
						// temp_x = (x_target - x_i) 
						double temp_x = temp_position.getX() - target_agent.position.getX();

						// temp_y = (y_target - y_i)
						double temp_y = temp_position.getY() - target_agent.position.getY();

						//e.distance = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
						e.distance = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2)) - a.radius;
					
						//To prevent wrong margin.
						//Distance of 4.99 for example.
						//Distance of 4.99 will not make agent cuts the rectangle later
						//But 5.00 will make agent cuts the rectangle
						if (e.distance < Main.global_var.agent_radius)
						{
							e.distance =  Main.global_var.agent_radius;
						}
						
						for (Entity e1 : sorted_entity)
						{
							//If the distance is too close, it's not worth to check all of them
							if (e.distance >=  e1.distance - 0.1 && e.distance  <= e1.distance + 0.1)
							{
								same_distance = true;
							}
						}
						
						
						if (same_distance == false)
							sorted_entity.add(e);

					}
					
				
				}
				else if (e instanceof Obstacle_circle)
				{
					Obstacle_circle oc = (Obstacle_circle) e;
					
					if (getCircleEntityWithinFOV(target_agent, oc.pos, FOV_start, FOV_end, oc.radius, timesteps) == true 
							|| oc.always_sense == true )
					{
						
						Position temp_position = oc.pos;

						if (e.warp == true)
						{
							temp_position = target_agent.position.getWarpPosition(target_agent.position, oc.pos);
						}
						
						// temp_x = (x_target - x_i) 
						double temp_x = temp_position.getX() - target_agent.position.getX();

						// temp_y = (y_target - y_i)
						double temp_y = temp_position.getY() - target_agent.position.getY();

						e.distance = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2)) - oc.radius;
						
						/*
						for (Entity e1 : sorted_entity)
						{
							//If the distance is too close, it's not worth to check all of them
							if (e1.distance <= e.distance && e1.distance >= e.distance )
							{
								same_distance = true;
							}
						}
						*/
						
						if (same_distance == false)
							sorted_entity.add(e);
					}
					
					//reset right way
					oc.always_sense = false;
				}
				else if (e instanceof Obstacle_rectangle)
				{
					
				}
			}
				
		}
		
		
		Collections.sort(sorted_entity, new SortEntitybyDistance());
		
		//sorted_entity.removeIf(n -> n.distance < 7);
		
		//To reduce the computational cost
		//We reduce the entity used for FOV_distance to just 3 agents
		//Nearest, farthest, and average
		
		Entity nearest = null;
		Entity farthest = null;
		Entity average = null;
		
		/*
		if (sorted_entity.size() > 3)
		{
			nearest = sorted_entity.get(0);
			
			farthest = sorted_entity.get(sorted_entity.size() - 1);
			
			int middle_index = sorted_entity.size()/2;
			
			average = sorted_entity.get(middle_index);
			
			sorted_entity.clear();
			
			sorted_entity.add(nearest);
			sorted_entity.add(average);
			sorted_entity.add(farthest);
		}
		*/
		
		//Adding gradunality of 10 start from the nearest entity first
		
		if (sorted_entity.size() >= 3)
		{
			nearest = sorted_entity.get(0);
			
			sorted_entity.clear();
			sorted_entity.add(nearest);
			
			double distance_increase = nearest.distance;
			
			while (distance_increase < Main.global_var.fov_distance)
			{
				distance_increase += 10;
				
				if (distance_increase >  Main.global_var.fov_distance)
				{
					distance_increase = Main.global_var.fov_distance;
				}
				
				Entity t = new Entity(0.0);
				t.distance = distance_increase;
				
				sorted_entity.add(t);
			}
			
		}
		
		/*
		farthest = sorted_entity.get(sorted_entity.size() - 1);
		sorted_entity.clear();
		sorted_entity.add(farthest);
		*/
		
		return sorted_entity;
	}
	
	//True distance between starting and ending angle
	//Not find the smallest
	public int diffBetween2AnglesIncrease(int start, int end)
	{
		int difference = 0;

		if (end > 360)
		{
			end = end - 360;
		}
		
		while(start != end)
		{

			if (start==359)
			{
				start = 0;
				difference++;
			}
			else
			{
				start++;
				difference++;
			}
			
		}
		
		return difference;
	}
	
	static int diffBetween2AnglesDecrease(int end, int start)
	{
		int difference = 0;
		
		
		if (end > 360)
		{
			end = end - 360;

		}
		
		while (end != start)
		{
			
			if (end == 0)
			{
				end = 359;
				difference++;
			}
			else
			{
				end--;
				difference++;
			}
		}
		
		return difference;
	}
	
}

class SortEntitybyDistance implements Comparator<Entity> 
{ 
    // Used for sorting in decending order of 
    // roll number 
    public int compare(Entity a, Entity b) 
    { 
    	if (a.distance - b.distance > 0)
    	{
    		return 1;
    	}
    	else if (a.distance - b.distance < 0)
    	{
    		return -1;
    	}
    	else
    	{
    		return 0;
    	}
    } 
} 



