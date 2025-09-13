package fitnessFuntcion;

import java.util.ArrayList;
import java.util.Arrays;

import Activation.Activation;
import Goal.Goal;
import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;
import behavior.Behavior;
import core.Main;
import entities.Entity;
import filters.Filter;
import filters.Filter_method;
import filters.Filter_ranged;
import obstacles.Obstacle;

class ReturnVar 
{
	Position pos;

	int heading;

	double speed;

	double offset;

	String extract_method = null;


	public GlobalVariable global_var = new GlobalVariable();

	public ReturnVar()
	{
		pos = new Position(0,0);
		this.heading = 0;
		this.extract_method = "null";
		this.speed = global_var.agent_speed;
	}

	public void setPosition(Position position)
	{
		this.pos = position;
	}

	public Position getPosition()
	{
		return this.pos;
	}


	public void setHeading(int heading)
	{
		this.heading = heading;
	}

	public int getHeading()
	{
		return this.heading;
	}

	public void setSpeed(double speed)
	{
		this.speed = speed;
	}

	public double getSpeed()
	{
		return this.speed;
	}

	public void setExtractMethod(String s)
	{
		this.extract_method = s;
	}

	public String getExtractmethod()
	{
		return this.extract_method;
	}

	public void setOffset(double offset)
	{
		this.offset = offset;
	}

	public double getOffset()
	{
		return this.offset;
	}
}

public class snakeShapeFitnessMetric 
{
	//Run model
	int fitnessScore = 0;
	ArrayList<Agent> agents = new ArrayList<Agent>();
	ArrayList<Entity> entities = new ArrayList<Entity>();
	Agent nearest_agent = null;
	public GlobalVariable global_var = new GlobalVariable();
	public ReturnVar return_var = new ReturnVar();

	public snakeShapeFitnessMetric(ArrayList<Entity> entity_add)
	{
		
		for (Entity e: entity_add)
		{
			this.entities.add(e);
			//Agent type
			if(e instanceof Agent)
			{
				agents.add((Agent) e);
			}
			
		}
	}

	public int fitnessScore(int timesteps)
	{	
		
		return fitnessScore;
	}

}
