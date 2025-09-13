package Utility;

import java.util.ArrayList;
import java.util.Arrays;

import agents.Property;
import behavior.Behavior;

public class GlobalVariable {
	// Run model
	// How many steps for the simulation
	
	public String hallway_size = "default";
	public int random_seed;
	public boolean random_no_seed;
	public boolean print_info_debug;
	public boolean search_Model;
	public boolean add_knowledge;
	public int duration;
	public int burn_in_step;
	public int WorldSize_height;
	public int WorldSize_width;
	public boolean worldWarp;

	public int num_of_agents;
	public boolean agent_overlap;
	public int agent_radius;
	public int agent_personal_space;
	public double agent_speed;
	public int unknow_Property1;

	public int num_of_obstacles;
	
	public double fov_distance;
	public int fov_angle;
	public int fov_segment;
	public int fov_round;
	public boolean fov_Draw;
	public double empty_space_therhold;
	public boolean simulation_Draw;
	// for special agent
	public int specialAgent;

	// For agent generator
	public int generator_density;
	public int generator_rate;
	public int generator_duration;
	// Options for model

	public String init_model;
	public String init_agent;
	public String init_obstacle;

	// Behavior
	public String init_behavior;
	public int max_slope;

	// Sorely for hard-code only
	public ArrayList<Behavior> behavior_Group = new ArrayList<Behavior>();
	public ArrayList<Property> property_set = new ArrayList<Property>();

	// FIlter
	public String init_filter;
	public int max_filter;

	// Variable for GA
	public int num_model;
	public int max_behavior_group;
	public int max_behavior;
	public int simulation_per_generation;

	// Genetic Algorithm
	public int num_generation;
	public double stop_score;

	public GlobalVariable() 
	{
		this.hallway_size = "regular";
		this.random_seed = 4;
		this.random_no_seed = true;
		
		this.print_info_debug = false;
		this.search_Model = false;
		this.simulation_Draw = true;
		this.add_knowledge = false;

		this.duration = 2000;
		this.burn_in_step = this.duration / 3;
		//this.burn_in_step = 0;
		// density = 2
		// this.WorldSize_height = 155;
		// density = 3
		//For evacuation test
		this.WorldSize_height = 500;
		this.WorldSize_width = 500;
		
		//For snake and circle test
		//this.WorldSize_height = 300;
		//this.WorldSize_width = 300;
		this.worldWarp = true;

		this.num_of_obstacles = 0;
		this.num_of_agents = 1;
		this.agent_radius = 5;
		this.agent_speed = 2;
		this.agent_personal_space = 10;
		// Activation function
		this.max_slope = 10;

		// Filed of View parameter
		this.fov_distance = 60;
		this.fov_angle = 360;
		this.fov_segment = 1;
		this.empty_space_therhold = 0.9;
		this.fov_round = 3;
		this.fov_Draw = false;

		// special agent is used to keep track one specific agent
		// this agent will have different color from the rest
		this.specialAgent = 0;

		agent_overlap = false;

		if (this.search_Model == false) 
		{
			num_model = 12;
			init_model = "hardcode";
		} 
		else 
		{
			// make sure this number is divisible by 4 to get the best outcome
			num_model = 20;
			init_model = "hardcode";
		}

		init_agent = "random";

		init_obstacle = "random_obs";

		// For agent genreator
		generator_density = 4;
		generator_rate = 40;
		generator_duration = 120;

		max_behavior_group = 2;

		// BEHAVIOR
		max_behavior = 5;

		// FILTER
		max_filter = 3;

		// Genetic Algorithm
		num_generation = 5;
		simulation_per_generation = 2;
		stop_score = 0.98;

	}
}
