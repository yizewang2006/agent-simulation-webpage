package agents;

import java.awt.Color;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

import Activation.Activation;
import Goal.Goal;
import Goal.Goal_point;
import Goal.Goal_rectangle;
import Utility.GlobalVariable;
import Utility.myUtility;
import behavior.Behavior;
import behavior.BehaviorGroup;
import behavior.Constraint;
import core.Main;
import entities.Entity;
import zones.Zone;
import zones.Zone_rectangle;

public class Agent extends Entity
{
	//Run model
	public GlobalVariable global_var = new GlobalVariable();
	public myUtility myUtility = new myUtility();
	
	//Parameter of agents
	public FieldOfView fov = new FieldOfView(global_var.fov_distance, global_var.fov_angle);
	
	public int radius = global_var.agent_radius;	
	
	public boolean warp = false;
	
	public boolean check = true;
	
	//Extracted property
	//Position: range is 0 - world size
	public Position position_previous = new Position(0,0);
	public Position position = new Position(0,0);
	public Position position_next = new Position(0,0);
	
	//Heading: range 0 - 360
	public Heading heading = new Heading(2,0,0,360,36,true, false); 
	
	//public Property_numeric(int ID, double init_value,boolean p, boolean g, double lRange, double uRange, double value_interval)
	public Property speed = new Property_numeric(3,3,true, false,0,3,0.1); 
	//Speed:
	
	//public Property_category(int ID, double init_value,boolean p, boolean g, ArrayList<Double> set_add)
	public Property type = new Property_category(4,1,false, false, new ArrayList<Double>(Arrays.asList(1.0, 1.1))); 
	
	public Property zone_in = new Property_category(5,1,false, false, new ArrayList<Double>(Arrays.asList(3.0,3.1))); 
	
	public Property distance_to_goal = new Property_numeric(6,300, true, false, 0,300, 10);
	
	//Type: 0 is agent, 1 is obstacle
	//public int type = 0;
	public int energy = 90000;
	//HISTORY array
	//Save all the position(x,y) at each step of the simulation
	public ArrayList<Position> pos_history =new ArrayList<Position>();
	public ArrayList<Integer> heading_history = new ArrayList<Integer>();
	//public ArrayList<Double> type_history = new ArrayList<Double>();
	
	//only for debug - not related to the model.
	//only special Agent will have this
	public ArrayList<Position> aiming_history =new ArrayList<Position>();
	
	public ArrayList<Property> property_set = new ArrayList<Property>();
	
	//BehaviorGroup - store all behavior (making decision of each Agent)
	public ArrayList<BehaviorGroup> behavior_Group = new ArrayList<BehaviorGroup>();

	//Constraint Group - store all constraints that will limit action of agent
	public ArrayList<Constraint> constraint_set = new ArrayList<Constraint>();
		
	public Double priority = Double.MAX_VALUE;
	
	//Each agent has a preset of desired direction, and should be different from agent to agent.
	
	public ArrayList<Goal> goal_task = new ArrayList<Goal>();
	
	public Agent()
	{
		super(1.0);
	}
	
	public Agent(String init_option, int i_agent, ArrayList<Entity> entity)
	{
		//1.1 is default type of agent
		super(1.0);
		
		
		//Hard code new property here.
		//making random values that follow normal distribution
		//double patient_temp = generator.nextGaussian() * 50;
		
		//int patient_temp = generator.nextInt(100);
		
		//User defined constructor
		//PropertyID - initial value - lower bound, upper bound, value_interval
		//Property new_p = new Property(7,100,0,100,5);
		
		//property_set.add(new_p);
		
		//property set of global class only used to get value references of property set 
		//global_var.property_set = property_set;

		//Set speed interval for speed
		
		
		
		if (init_option.equals("random"))
		{
			//Position for each agent at the beginning is assign randomly
			//Initialize random position
			//position.createRandomPosition();
			
			/*
			if (i_agent == 0)
			{
				position.createRandomPositionInFixZone(new Zone(1.0, new Position(115,72),30,30), entity);
			}
			else if (i_agent == 1)
			{
				position.createRandomPositionInFixZone(new Zone(1.0, new Position(85,91),30,30), entity);
			}
			else if (i_agent == 2)
			{
				position.createRandomPositionInFixZone(new Zone(1.0, new Position(65,121),30,30), entity);
			}
			else if (i_agent == 3)
			{
				position.createRandomPositionInFixZone(new Zone(1.0, new Position(85,152),30,30), entity);
			}
			else if (i_agent == 4)
			{
				position.createRandomPositionInFixZone(new Zone(1.0, new Position(115,170),30,30), entity);
			}
			*/
			
			//position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(15,66),20,87), entity);
			
			position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(65,65),global_var.WorldSize_height,global_var.WorldSize_width), entity);
			
			heading.value = 0;
			this.type.value = 1.0;

			Random rand;
			
			if (Main.global_var.random_no_seed == true)
			{
				rand = new Random();  
			}
			else
			{
				rand = new Random(Main.global_var.random_seed);  
			}

			//Heading also need to be random.
			heading.value = rand.nextInt(heading.upperRange);
			//heading.value = 0;
			
			//speed = rand.nextInt(10) + 2;
			heading_history.add(heading.value);	

			//type_history.add(type);
			//The initial position and heading angle is added to
			//the very first index of position and heading_history
			this.position_next = new Position(position.x, position.y);

			pos_history.add(this.position_next );
			
			boolean in_zone = false;
			
			//Set zone values
			for (Goal g : Main.goals)
			{
				if (g instanceof Goal_rectangle)
				{
					if (getCurrentZone((Goal_rectangle) g) != 0)
					{
						this.zone_in.value = g.type.value;
						in_zone = true;
					}
				}	
			}
			
			//Default zone - if agent in not inside any prezone set
			if (in_zone == false)
			{
				this.zone_in.value = -3.0;
			}

			
		}
		else
		{	
			position.createRandomPositionInFixZone(new Zone_rectangle(1.0, new Position(0,63),20,87), entity);
		
			//heading.value = 0;
			this.type.value = 1.0;

			Random rand;
			
			if (Main.global_var.random_no_seed == true)
			{
				rand = new Random();  
			}
			else
			{
				rand = new Random(Main.global_var.random_seed);  
			}

			//Heading also need to be random.
			heading.value = rand.nextInt(heading.upperRange);
			

			speed.value = 0;
			
			//type_history.add(type);
			//The initial position and heading angle is added to
			//the very first index of position and heading_history
			this.position_next = new Position(position.x, position.y);

			this.distance_to_goal.value = position.getDistanceBetween2Position(position, new Position(150,136));
			
			
			
		}
	}
	
	//Hard code position and heading angle for agent
	public Agent(Position pos, int heading, double speed, double sub_type)
	{
		super(1);
		
		
		//Hard code new property here.
		//We know that ID 1,2,3,4,5 are reserve for position, angle different, heading angle and angle to position, speed, and type
		//Property new_p = new Property(7,50,0,50,5);
				
		//property_set.add(new_p);
		
		//Adding random direction
		heading_history.add(heading);
			
		//Will update the next location base of angle and speed.
		//pos.setNextPositionFromAngleAndSpeed(pos, heading_history.get(i), speed);
			
		this.position.x = pos.x;
		this.position.y = pos.y;
		
		this.distance_to_goal.value = position.getDistanceBetween2Position(position, new Position(150,136));
		
		this.heading.value = heading;
		
		Position temp = new Position(pos.x, pos.y);
			
		pos_history.add(temp);
		
		this.speed.value = speed;
		
		this.type.value = sub_type;
		
		boolean in_zone = false;
		//Set zone values
		for (Goal g : Main.goals)
		{
			if (g instanceof Goal_rectangle)
			{
				if (getCurrentZone((Goal_rectangle) g) != 0)
				{
					this.zone_in.value = g.type.value;
					in_zone = true;
				}
			}	
		}
		
		//Default zone - if agent in not inside any prezone set
		if (in_zone == false)
		{
			this.zone_in.value = -3.0;
		}
		//type_history.add(super.type);
					
	}
	
	//Deep copy agent
	public Agent(Agent a)
	{
		super(1);
		
		heading_history.add(a.heading.value);
		
		this.position.x = a.position.x;
		this.position.y = a.position.y;
		
		this.heading.value = a.heading.value;
		
		Position temp = new Position(a.position.x, a.position.y);
			
		pos_history.add(temp);
		
		this.speed.value = a.speed.value;
		
		this.type.value = a.type.value;
		
		boolean in_zone = false;
		//Set zone values
		for (Goal g : Main.goals)
		{
			if (g instanceof Goal_rectangle)
			{
				if (getCurrentZone((Goal_rectangle) g) != 0)
				{
					this.zone_in.value = g.type.value;
					in_zone = true;
				}
			}	
		}
		
		//Default zone - if agent in not inside any prezone set
		if (in_zone == false)
		{
			this.zone_in.value = -3.0;
		}
		
		this.check = a.check;
	}
	
	
	
	public double getCurrentZone(Goal_rectangle g)
	{
		double zone_ID = 0;

		if (position.x > g.zone_goal.leftB() && position.x < g.zone_goal.rightB() 
				&& 
			position.y > g.zone_goal.upperB() && position.y < g.zone_goal.lowerB())
		{
			//For checking purpose
			Property_category zt = (Property_category) zone_in;
			
			if (zt.set.contains(g.ID) == false)
			{
				System.out.println ("number of zone ID and zone range property is not match");
			}
			else
			{
				this.zone_in.value = g.ID;
				return this.zone_in.value;
			}
		}
		
		return zone_ID;
	}
	
	
	/*
	public double getCurrentZone(Zone z)
	{
		double zone_ID = 0;

		if (position.x > z.leftB() && position.x < z.rightB() && position.y > z.upperB() && position.y < z.lowerB())
		{
			//For checking purpose
			Property_category zt = (Property_category) zone_goal;
			
			if (zt.set.contains(z.ID) == false)
			{
				System.out.println ("number of zone ID and zone range property is not match");
			}
			else
			{
				this.zone_goal.value = z.ID;
				return this.zone_goal.value;
			}
		}
		
		return zone_ID;
	}*/
	
	
	public boolean checkPropertyPublicStatus(double extract_p)
	{

		if (extract_p == 1)
		{
			return position.pub;
		}
		else if (extract_p == 2.0 || extract_p == 2.1)
		{
			return heading.pub;
		}
		else if (extract_p == 3.0)
		{
			return speed.pub;
		}
		else if (extract_p == 4.0)
		{
			return type.pub;
		}
		else if (extract_p == 5.0)
		{
			return zone_in.pub;
		}
		
		return false;
	}
	
	public void addBehavior(ArrayList<BehaviorGroup> behavior_Group_add)
	{
		for (BehaviorGroup b: behavior_Group_add)
		{
			this.behavior_Group.add(b);
		}
	}
	
	//At the end of this step, all constraints of the same property will be combine into one constraint only
	public void addConstraint(ArrayList<Constraint> constraint_set_add)
	{
		boolean exist = false;
		
		double min_max_increase = Double.MAX_VALUE;
		double min_max_decrease = Double.MAX_VALUE;
		double min_max_range = Double.MAX_VALUE;
		double min_min_range = Double.MAX_VALUE;
		
		//Get angle constraint
		for (Constraint c: constraint_set_add)
		{
			if(c.property_ID == 2 || c.property_ID == 6)
			{
				exist = true;
				if(c.max_decrease < min_max_increase)
				{
					min_max_increase = c.max_increase;
				}
				
				if (c.max_decrease < min_max_decrease)
				{
					min_max_decrease = c.max_decrease;
				}
				
				if (c.max_value < min_max_range)
				{
					min_max_range = c.max_value;
				}
				
				if (c.min_value < min_min_range)
				{
					min_min_range = c.min_value;
				}
			}
		}
		
		//After this step, min values of 4 parameters will be the intersect between all the constraint
		//For example 
		//c1 = <angle, 60, -60, 360, -360>
		//c2 = <angle, 70, -50, 200, -100>
		// => end result = <angle, 60, -50, 200, -100>
		//Get speed constraint
		if (exist == true)
			this.constraint_set.add(new Constraint(2,min_max_increase, min_max_decrease, min_max_range, min_min_range));
		
		exist = false;
		min_max_increase = Double.MAX_VALUE;
		min_max_decrease = Double.MAX_VALUE;
		min_max_range = Double.MAX_VALUE;
		min_min_range = Double.MAX_VALUE;
		
		for (Constraint c: constraint_set_add)
		{
			if(c.property_ID == 3)
			{
				exist = true;
				if(c.max_decrease < min_max_increase)
				{
					min_max_increase = c.max_increase;
				}
				
				if (c.max_decrease < min_max_decrease)
				{
					min_max_decrease = c.max_decrease;
				}
				
				if (c.max_value < min_max_range)
				{
					min_max_range = c.max_value;
				}
				
				if (c.min_value < min_min_range)
				{
					min_min_range = c.min_value;
				}
			}
		}
		
		if (exist == true)
			this.constraint_set.add(new Constraint(3,min_max_increase, min_max_decrease, min_max_range, min_min_range));
		
	}
	
}

class PresetZoneGoal
{
	public Zone zone;
	public Goal goal;
	
	public PresetZoneGoal(Zone z, Goal g)
	{
		this.zone = z;
		this.goal = g;
	}
	
}
