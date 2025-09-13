package fitnessFuntcion;

import java.util.ArrayList;

import Utility.GlobalVariable;
import agents.Agent;
import agents.Position;

public class CircleShapeFitnessMetric 
{
	double fitnessScore = 0;
	double minRadius = 0;
	double maxRadius = 0;
	ArrayList<Agent> agents;
	public double dis_ave;
	public ArrayList<Double> dis_ave_list = new ArrayList<Double>();
	ArrayList<ArrayList<Double>> dis_to_center_list = new ArrayList<>();

	GlobalVariable global_var = new GlobalVariable();

	public CircleShapeFitnessMetric(ArrayList<Agent> agents, double mRadius, double maxRadius)
	{
		this.agents = agents;
		this.minRadius = mRadius;
		this.maxRadius = maxRadius;
	}


	//Only work for 25 agents or less.
	//Because the more agent we have, the more chance the circle will form wil redius greater than world_size/2
	public double fitnessScore(int timesteps)
	{

		double sum_x = 0;
		double sum_y = 0;

		ArrayList<Double> dis_to_center = new ArrayList<Double>();

		//Will need 3 dis_ave here
		//One with no warp
		//One warp RIGHT
		//One warp DOWN
		//Get dis_ave with no warp 
		for (Agent a : agents)
		{
			sum_x += a.position.x;
			sum_y += a.position.y;
		}

		double ave_x = sum_x / agents.size();
		double ave_y = sum_y / agents.size();

		this.dis_ave = 0;

		for (Agent a : agents)
		{
			double temp_x = (ave_x - a.position.x);
			double temp_y = (ave_y - a.position.y);

			double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
			dis_to_center.add(dis); 

			this.dis_ave += dis;
		}

		this.dis_ave = this.dis_ave / agents.size();

		dis_to_center_list.add(dis_to_center);
		dis_ave_list.add(this.dis_ave);


		//Get dis_ave warp to the RIGHT
		sum_x = 0;
		sum_y = 0;
		dis_to_center = new ArrayList<Double>();

		for (Agent a : agents)
		{
			if (a.position.x < global_var.WorldSize_width/2)
			{
				sum_x += a.position.x + global_var.WorldSize_width;
			}
			else
			{
				sum_x += a.position.x;
			}

			sum_y += a.position.y;
		}

		ave_x = sum_x / agents.size();
		ave_y = sum_y / agents.size();

		this.dis_ave = 0;

		for (Agent a : agents)
		{
			double temp_x = 0;

			if (a.position.x < global_var.WorldSize_width/2)
			{
				temp_x = (ave_x - (a.position.x + global_var.WorldSize_width));
			}
			else
			{
				temp_x = (ave_x - a.position.x);
			}

			double temp_y = (ave_y - a.position.y);

			double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));

			dis_to_center.add(dis); 

			this.dis_ave += dis;
		}

		this.dis_ave = this.dis_ave / agents.size();

		dis_to_center_list.add(dis_to_center);
		dis_ave_list.add(this.dis_ave);


		//Get dis_ave warp to  DOWN
		sum_x = 0;
		sum_y = 0;
		dis_to_center = new ArrayList<Double>();

		for (Agent a : agents)
		{
			sum_x += a.position.x;

			if (a.position.y < global_var.WorldSize_height/2)
			{
				sum_y += a.position.y + global_var.WorldSize_height;
			}
			else
			{
				sum_y += a.position.y;
			}

		}

		ave_x = sum_x / agents.size();
		ave_y = sum_y / agents.size();

		this.dis_ave = 0;

		for (Agent a : agents)
		{
			double temp_x = (ave_x - a.position.x);
			double temp_y = 0;

			if (a.position.y < global_var.WorldSize_height/2)
			{
				temp_y = (ave_y - (a.position.y + global_var.WorldSize_height));
			}
			else
			{
				temp_y = (ave_y - a.position.y);
			}

			double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));

			dis_to_center.add(dis); 

			this.dis_ave += dis;
		}

		this.dis_ave = this.dis_ave / agents.size();

		dis_to_center_list.add(dis_to_center);
		dis_ave_list.add(this.dis_ave);

		/////////////////warp agent to the right, then warp down.
		ArrayList<Agent> agent_temp = new ArrayList<Agent>();
		//Get dis_ave warp to  DOWN
		sum_x = 0;
		sum_y = 0;
		dis_to_center = new ArrayList<Double>();

		//deep copy
		for(Agent a: agents)
		{
			agent_temp.add(new Agent(a.position,0,2,0));
		}

		for (Agent a: agent_temp)
		{
			if (a.position.x < global_var.WorldSize_width/2)
			{
				a.position.x = a.position.x + global_var.WorldSize_width;
			}

			if (a.position.y < global_var.WorldSize_height/2)
			{
				a.position.y = a.position.y + global_var.WorldSize_height;
			}
		}

		for (Agent a : agent_temp)
		{
			sum_x += a.position.x;
			sum_y += a.position.y;
		}

		ave_x = sum_x / agents.size();
		ave_y = sum_y / agents.size();

		this.dis_ave = 0;

		for (Agent a : agent_temp)
		{
			double temp_x = (ave_x - a.position.x);
			double temp_y = (ave_y - a.position.y);

			double dis = Math.sqrt(Math.pow((temp_x),2) + Math.pow(temp_y,2));
			dis_to_center.add(dis); 

			this.dis_ave += dis;
		}

		this.dis_ave = this.dis_ave / agents.size();

		dis_to_center_list.add(dis_to_center);
		dis_ave_list.add(this.dis_ave);


		//Find which warp give the smallest distance ave
		double smallest = Double.MAX_VALUE;
		int chosen_index = 0;

		for (int i = 0; i < dis_ave_list.size(); i++)
		{
			if (dis_ave_list.get(i) < smallest)
			{
				smallest = dis_ave_list.get(i);
				chosen_index = i;
			}
		}

		//System.out.println("Distance ave: " + dis_ave_list.get(chosen_index));
		for (Double d : dis_to_center_list.get(chosen_index))
		{
			this.fitnessScore += Math.abs(dis_ave_list.get(chosen_index)-d);
		}

		return this.fitnessScore;

	}
}
