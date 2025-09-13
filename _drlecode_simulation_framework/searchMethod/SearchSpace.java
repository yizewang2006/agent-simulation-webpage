package searchMethod;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Random;

import core.Main;
import filters.Filter;
import filters.Filter_ranged;

//Search space contains all possibilities that a model can have

public class SearchSpace 
{
	//BELOW is all options for GA
	//
	//Type:
	//1.0 Agent (1.0 is blue, 1.1 is red)
	//2.0 Obstacle
	//3.0 Goal (3.0 is red goal, 3.1 is blue goal)
	public ArrayList<Double> entity_type = new ArrayList<Double>(Arrays.asList(1.0, 2.0, 3.0, 3.1));
	
	
	//Property
	//Apply for activation and filter
	//1.0: Position
	//2.0: Angle 
	//2.1: Angle difference between heading and heading to target agent.
	//3.0: Speed
	//4.0: Type
	//5.0: Zone
	//When add more property, check for "extract_p" keyword in the whole project
	public ArrayList<Double> properties = new ArrayList<Double>(Arrays.asList(1.0,2.0,3.0));

	//Numerical extraction property type
	public ArrayList<Double> numerical_property = new ArrayList<Double>(Arrays.asList(1.0,2.0,2.1,3.0));
	
	//Categorical extraction property type
	public ArrayList<Double> categorical_property = new ArrayList<Double>(Arrays.asList(4.0));
	
	//Behavior option
	//Option 0: get reference from self
	//Option 1: get reference from neighbor
	//Option 2: get reference from space
	public ArrayList<Integer> action_option = new ArrayList<Integer>(Arrays.asList(0,1,2));

	// 1 -> nearest_desired
	// 2 -> farthest 
	// 3 -> nearest_turning
	// 4 -> density within [-10,10]
	// 5 -> predict distance to entrance
	public ArrayList<Double> act_on_space_property = new ArrayList<Double>(Arrays.asList(1.0, 2.0 , 2.1, 2.5, 3.0));

	//Filter
	//Filter type
	//0: Ranged filter
	//1: Combination method filter
	public ArrayList<Integer> filter_type = new ArrayList<Integer>(Arrays.asList(0,1));

	//public ArrayList<Double> filter_range_property= new ArrayList<Double>(Arrays.asList(1.0,2,1,3.0,4.0));
	
	//All behavior must have one category filter
	public ArrayList<Double> filter_range_property= new ArrayList<Double>(Arrays.asList(1.0, 2.0, 2.1, 3.0,4.0));
	
	//Filter range for space behvaior
	public ArrayList<Double> filter_range_property_space= new ArrayList<Double>(Arrays.asList(1.0, 2.0,2.1,2.5,3.0));

	//Method filter should not be used for category property
	//Method filter has 5 methods:
	//Nearest: 1.0, 2.0, 2.1, 3.0
	//Farthest: 1.0, 2.0, 2.1, 3.0
	//Max: 3.0
	//Min: 3.0
	//random: special case, choose any neighbor

	public ArrayList<Double> filter_method_property= new ArrayList<Double>(Arrays.asList(1.0,2.1,3.0));

	public ArrayList<Integer> filter_method= new ArrayList<Integer>(Arrays.asList(1));

	//All behavior must have one category filter
	public ArrayList<Double> filter_method_property_for_space = new ArrayList<Double>(Arrays.asList(1.0, 2.0, 3.0));

	public ArrayList<Integer> filter_method_space= new ArrayList<Integer>(Arrays.asList(1));
		
	//Activation

	//Activation weight for always activation and binary fucntion
	public ArrayList<Double> activation_weight = new ArrayList<Double>(Arrays.asList(1.0, 5.0, 10.0, 20.0, 50.0));
	//0: Always true
	//1: self 
	//2: neighbor
	//3: space
	public ArrayList<Integer> activation_option = new ArrayList<Integer>(Arrays.asList(0,1,2,3));
	
	public ArrayList<Double> activation_self_check_properties = new ArrayList<Double>(Arrays.asList(2.0,3.0));
	
	public ArrayList<Double> activation_neighbor_check_properties = new ArrayList<Double>(Arrays.asList(1.0, 2.1,3.0));
	
	public ArrayList<Double> activation_space_check_properties = new ArrayList<Double>(Arrays.asList(1.0,2.0,2.1,2.5,3.0));
	
	//Activation function option
	//0: return weight = 1
	//1: binary funciton
	//2: linear function - does not apply for category properties
	public ArrayList<Integer> activation_function_option = new ArrayList<Integer>(Arrays.asList(1,2));
	
	public ArrayList<Double> linear_activation_function_slope = new ArrayList<Double>(Arrays.asList(1.0,5.0,10.0,50.0,100.0));
	
	public ArrayList<filterTemplate_dataStructure> filter_template = new ArrayList<filterTemplate_dataStructure>();
	
	public ArrayList<filterTemplate_dataStructure> filter_template_forSpace_behavior = new ArrayList<filterTemplate_dataStructure>();
	
	//offset at least for now is only for angle
	//later on expansion: offset will need to be structure as a data structure template.
	public ArrayList<offsetTemplate_dataStructure> offset_template = new ArrayList<offsetTemplate_dataStructure>();
	
	
	public SearchSpace()	
	{
		//Create a template search space for filters
		ArrayList<Filter> filter_chain = new ArrayList<Filter>();
		
		//Filter for distance
		//[0-20] , [0-40], [0-60]
		filter_chain.add(new Filter_ranged(1.0, 0, 20, 0));
		filter_chain.add(new Filter_ranged(1.0, 0, 40, 0));
		filter_chain.add(new Filter_ranged(1.0, 0, 60, 0));
		
		filter_template.add(new filterTemplate_dataStructure(1, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(1.1, 5, 15, 0));
		filter_chain.add(new Filter_ranged(1.1, 5, 25, 0));
		filter_chain.add(new Filter_ranged(1.1, 5, 35, 0));
		filter_chain.add(new Filter_ranged(1.1, 5, 45, 0));
		filter_chain.add(new Filter_ranged(1.1, 5, 55, 0));
		filter_chain.add(new Filter_ranged(1.1, 5, 60, 0));
		
		filter_template.add(new filterTemplate_dataStructure(1.1, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(1.2, 5, 15, 0));
		filter_chain.add(new Filter_ranged(1.2, 5, 25, 0));
		filter_chain.add(new Filter_ranged(1.2, 5, 35, 0));
		filter_chain.add(new Filter_ranged(1.2, 5, 45, 0));
		filter_chain.add(new Filter_ranged(1.2, 5, 55, 0));
		filter_chain.add(new Filter_ranged(1.2, 5, 60, 0));
		
		filter_template.add(new filterTemplate_dataStructure(1.2, filter_chain));
		
		filter_chain.clear();
		
		//filter chain for angle difference between heading direction and direction to chosen agent
		// [-10, 10], [-20, 20], [-30, 30], [-40, 40]. [-50, 50]
		//filter_chain.add(new Filter_ranged(2.1,-10,10));
		//filter_chain.add(new Filter_ranged(2.1,-20,20));
		//filter_chain.add(new Filter_ranged(2.1,-30,30));
		//filter_chain.add(new Filter_ranged(2.1,-40,40));
		//filter_chain.add(new Filter_ranged(2.1,-50,50));
		
		// [0 - 30], [0-60], [0-90]
		filter_chain.add(new Filter_ranged(2.1,0,30, 0));
		filter_chain.add(new Filter_ranged(2.1,0,60, 0));
		filter_chain.add(new Filter_ranged(2.1,0,90, 0));
		filter_chain.add(new Filter_ranged(2.1,0,120, 0));
		filter_chain.add(new Filter_ranged(2.1,0,150, 0));
		filter_chain.add(new Filter_ranged(2.1,0,180, 0));
		
		// [-90 - -1], [-60- -1], [-30- -1]
		//filter_chain.add(new Filter_ranged(2.1,-90,-1));
		//filter_chain.add(new Filter_ranged(2.1,-60,-1));
		//filter_chain.add(new Filter_ranged(2.1,-30,-1));
		
		filter_template.add(new filterTemplate_dataStructure(2.1, filter_chain));
		
		filter_chain.clear();
		
		//filter chain for angle difference between heading direction and direction to chosen agent
		// [-10, 10], [-20, 10], [-20, 10], [-30, 30], [-40, 40]. [-50, 50]
		filter_chain.add(new Filter_ranged(2.0 , 0 ,60, 0));
		filter_chain.add(new Filter_ranged(2.0 , 0 ,120, 0));
		filter_chain.add(new Filter_ranged(2.0 , 0 ,180, 0));
		filter_chain.add(new Filter_ranged(2.0 , 0 ,240, 0));
		filter_chain.add(new Filter_ranged(2.0 , 0 ,300, 0));
		filter_chain.add(new Filter_ranged(2.0 , 0 ,360, 0));
		
		filter_template.add(new filterTemplate_dataStructure(2.0, filter_chain));
		
		filter_chain.clear();
		
		//filter chain for speed
		//[0-0.2] . [0,0.5], [0,1], [0,1.5]
		filter_chain.add(new Filter_ranged(3.0, 0 , 0.2, 0));
		filter_chain.add(new Filter_ranged(3.0, 0 , 0.5, 0));
		filter_chain.add(new Filter_ranged(3.0, 0 , 1, 0));
		filter_chain.add(new Filter_ranged(3.0, 0 , 1.5, 0));
		
		filter_template.add(new filterTemplate_dataStructure(3.0, filter_chain));
		
		filter_chain.clear();
		
		//Category filter chain
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(1.0)),0));
		//filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(2.0)),0));
		//filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(2.1)),0));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.1)),0));
		
		/*
		//For any zone that is not pre-assign
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(-3.0))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.0))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.1))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.2))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.3))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.4))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.5))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.6))));
		
		//Rows
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.1, 3.2))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.3, 3.4))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.5, 3.6))));
		
		//Cols
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.1, 3.3, 3.5))));
		filter_chain.add(new Filter_ranged(4.0, new ArrayList<Double>(Arrays.asList(3.2, 3.4, 3.6))));
		*/
		
		filter_template.add(new filterTemplate_dataStructure(4.0, filter_chain));
		
		filter_chain.clear();
		//filter_chain for type different
		//1.0 filter to keep the same type
		//2.0 filter to keep the different type
		filter_chain.add(new Filter_ranged(4.1, new ArrayList<Double>(Arrays.asList(1.0)),0));
		filter_chain.add(new Filter_ranged(4.1, new ArrayList<Double>(Arrays.asList(2.0)),0));
		
		//filter_template.add(new filterTemplate_dataStructure(4.1, filter_chain));
		
		
		filter_chain.clear();
		//Filter different zone
		//Default zone
		/*
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(-3.0))));
		//filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(2.0))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.0))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.1))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.2))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.3))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.4))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.5))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.6))));
		
		//Rows
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.1, 3.2))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.3, 3.4))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.5, 3.6))));
		
		//Cols
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.1, 3.3, 3.5))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.2, 3.4, 3.6))));
		
		//Preset zone combination that flavor handcrafted model
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.4, 3.7))));
		filter_chain.add(new Filter_ranged(5.0, new ArrayList<Double>(Arrays.asList(3.1, 3.2, 3.3, 3.5, 3.6, -3.0))));
		
		filter_template.add(new filterTemplate_dataStructure(5.0, filter_chain));
		*/
		
		
		//Adding filter option for space behavior
		filter_chain.add(new Filter_ranged(1.0, 0, 30, 1));
		filter_chain.add(new Filter_ranged(1.0, 0, 60, 1));
		filter_chain.add(new Filter_ranged(1.0, 0, 90, 1));
		filter_chain.add(new Filter_ranged(1.0, 0, 120, 1));
		filter_chain.add(new Filter_ranged(1.0, 0, 150, 1));
		filter_chain.add(new Filter_ranged(1.0, 0, 180, 1));
		//Filter_p == 1 -> angle distance to desired direction
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(1, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.0, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.0, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.0, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.0, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.0, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.0, 20, 40, 1));
		//filter_p == 2 -> travel distance to entity
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.1, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.1, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.1, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.1, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.1, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.1, 20, 40, 1));
		//filter_p == 2.1 -> travel distance to agent
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2.1, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.2, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.2, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.2, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.2, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.2, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.2, 20, 40, 1));
		//filter_p == 2.2 -> travel distance to circle obstacle
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2.2, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.3, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.3, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.3, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.3, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.3, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.3, 20, 40, 1));
		//filter_p == 2.3 -> travel distance to rectangle obstacle
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2.3, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.4, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.4, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.4, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.4, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.4, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.4, 20, 40, 1));
		//filter_p == 2.4 -> travel distance to all obstacle
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2.4, filter_chain));
		
		filter_chain.clear();
		
		filter_chain.add(new Filter_ranged(2.5, 0, 20, 1));
		filter_chain.add(new Filter_ranged(2.5, 0, 40, 1));
		filter_chain.add(new Filter_ranged(2.5, 0, 60, 1));
		filter_chain.add(new Filter_ranged(2.5, 20, 60, 1));
		filter_chain.add(new Filter_ranged(2.5, 40, 60, 1));
		filter_chain.add(new Filter_ranged(2.5, 20, 40, 1));
		//filter_p == 2.4 -> travel distance to goal point (aka the leader)
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(2.5, filter_chain));
		
		filter_chain.clear();
		
		//filter_p == 3 -> angle distance to current direction
		filter_chain.add(new Filter_ranged(3.0, 0, 30, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 45, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 60, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 90, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 120, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 150, 1));
		filter_chain.add(new Filter_ranged(3.0, 0, 180, 1));

		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(3, filter_chain));
		
		filter_chain.clear();
		
		//filter_p == 4 -> density of a heading
		filter_chain.add(new Filter_ranged(4.0, 0, 5, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 10, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 15, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 20, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 25, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 30, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 35, 1));
		filter_chain.add(new Filter_ranged(4.0, 0, 40, 1));

		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(4, filter_chain));

		filter_chain.clear();
		
		//filter_p == 5 -> predict distance to entrance
		filter_chain.add(new Filter_ranged(5.0, 0, 20, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 40, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 60, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 80, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 100, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 140, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 180, 1));
		filter_chain.add(new Filter_ranged(5.0, 0, 220, 1));

		//filter_p == 2 -> travel farthest
		filter_template_forSpace_behavior.add(new filterTemplate_dataStructure(5, filter_chain));

		filter_chain.clear();
				
		ArrayList<Double> offset_list = new ArrayList<Double>();
		//Offset can only be these value 
		//[-90, -60, -30, 0, 30, 60, 90]
		offset_list.add(-90.0);
		offset_list.add(-75.0);
		offset_list.add(-60.0);
		offset_list.add(-45.0);
		offset_list.add(-30.0);
		offset_list.add(-15.0);
		offset_list.add(0.0);
		offset_list.add(15.0);
		offset_list.add(30.0);
		offset_list.add(45.0);
		offset_list.add(60.0);
		offset_list.add(75.0);
		offset_list.add(90.0);
		
		offset_template.add(new offsetTemplate_dataStructure (1.0, offset_list));
		offset_template.add(new offsetTemplate_dataStructure (2.0, offset_list));
		
		offset_list.clear();
		
		offset_list.add(-1.0);
		offset_list.add(-0.5);
		offset_list.add(-0.25);
		offset_list.add(-0.1);
		//offset_list.add(0.0);
		offset_list.add(0.1);
		offset_list.add(0.25);
		offset_list.add(0.5);
		offset_list.add(1.0);
		
		offset_template.add(new offsetTemplate_dataStructure (3.0, offset_list));
		
	}
	
	public ArrayList<Double> getOffsetList (double extract_p)
	{
		ArrayList<Double> return_list = new ArrayList<Double>();
		
		for (offsetTemplate_dataStructure ot : offset_template)
		{
			if (ot.offset_property == extract_p)
			{
				for (Double d: ot.offset_template_option)
				{
					return_list.add(d);
				}
			}
		}
		return return_list;
	}
	
	public Filter getAFilterTemplateOption (double filtered_p, ArrayList<filterTemplate_dataStructure> filter_template_list)
	{
		
		Random rand;
		
		if (Main.global_var.random_no_seed == true)
		{
			rand = new Random();  
		}
		else
		{
			rand = new Random(Main.global_var.random_seed);  
		}
		
		Filter chosen_filter = new Filter();
		
		for (filterTemplate_dataStructure f_t : filter_template_list)
		{
			if (filtered_p == f_t.filter_property)
			{
				//Choose a random option for the match filter property in the template
				chosen_filter = f_t.filter_template_option.get(rand.nextInt(f_t.filter_template_option.size()));
				
			}
		}
		
		return chosen_filter;
	}
	
	public double getOffset (double extract_p, int option)
	{
		double return_offset = 0;
		
		
		return return_offset;
	}
}
